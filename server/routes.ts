import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, updateOrderSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requirePermission, requireRole } from "./permissions";
import { parse as parseUrl } from "url";
import { parse as parseCookie } from "cookie";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication
  await setupAuth(app);
  
  // Get session parser for WebSocket authentication
  const { getSession } = await import("./replitAuth");
  const sessionParser = getSession();
  
  // Create WebSocket server with authentication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: (info) => {
      return new Promise((resolve) => {
        // Parse session from request using the session middleware
        sessionParser(info.req, {} as any, async () => {
          try {
            const session = (info.req as any).session;
            if (!session?.passport?.user?.sub) {
              console.log('WebSocket connection rejected: No authenticated session');
              resolve(false);
              return;
            }

            // Verify user exists and has read permissions
            const user = await storage.getUser(session.passport.user.sub);
            if (!user) {
              console.log('WebSocket connection rejected: User not found');
              resolve(false);
              return;
            }

            // Store user info for connection
            (info.req as any).userId = user.id;
            (info.req as any).userRole = user.role;
            resolve(true);
          } catch (error) {
            console.error('WebSocket auth error:', error);
            resolve(false);
          }
        });
      });
    }
  });
  
  // Store connected clients with user info
  interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    userRole?: string;
  }
  const clients = new Set<AuthenticatedWebSocket>();
  
  // WebSocket connection handling for authenticated users only
  wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
    // Set user info on WebSocket connection
    ws.userId = (request as any).userId;
    ws.userRole = (request as any).userRole;
    
    clients.add(ws);
    console.log(`New authenticated WebSocket connection from user ${ws.userId} (${ws.userRole}). Total clients:`, clients.size);
    
    // Send connection count to all clients
    broadcastToClients({
      type: 'client_count',
      data: { count: clients.size }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket disconnected for user ${ws.userId}. Total clients:`, clients.size);
      
      // Send updated connection count
      broadcastToClients({
        type: 'client_count',
        data: { count: clients.size }
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Function to broadcast messages to all connected clients
  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Set up PostgreSQL LISTEN/NOTIFY for order changes
  const setupDatabaseTriggers = async () => {
    try {
      // Create trigger function for order changes
      await db.execute(`
        CREATE OR REPLACE FUNCTION notify_order_changes()
        RETURNS trigger AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            PERFORM pg_notify('order_changes', json_build_object(
              'operation', 'INSERT',
              'data', row_to_json(NEW)
            )::text);
            RETURN NEW;
          ELSIF TG_OP = 'UPDATE' THEN
            PERFORM pg_notify('order_changes', json_build_object(
              'operation', 'UPDATE',
              'data', row_to_json(NEW),
              'old_data', row_to_json(OLD)
            )::text);
            RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
            PERFORM pg_notify('order_changes', json_build_object(
              'operation', 'DELETE',
              'data', row_to_json(OLD)
            )::text);
            RETURN OLD;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // Create triggers
      await db.execute(`
        DROP TRIGGER IF EXISTS order_changes_trigger ON orders;
        CREATE TRIGGER order_changes_trigger
        AFTER INSERT OR UPDATE OR DELETE ON orders
        FOR EACH ROW EXECUTE FUNCTION notify_order_changes();
      `);
      
      console.log('Database triggers created successfully');
    } catch (error) {
      console.error('Error setting up database triggers:', error);
    }
  };
  
  // Set up database listener
  const setupDatabaseListener = async () => {
    try {
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const client = await pool.connect();
      
      await client.query('LISTEN order_changes');
      
      client.on('notification', (msg) => {
        if (msg.channel === 'order_changes') {
          try {
            const payload = JSON.parse(msg.payload || '{}');
            console.log('Database notification:', payload);
            
            // Broadcast the change to all WebSocket clients
            broadcastToClients({
              type: 'order_change',
              data: payload
            });
          } catch (error) {
            console.error('Error parsing database notification:', error);
          }
        }
      });
      
      console.log('Database listener set up successfully');
    } catch (error) {
      console.error('Error setting up database listener:', error);
    }
  };
  
  // Initialize database triggers and listener
  await setupDatabaseTriggers();
  await setupDatabaseListener();
  
  // API Routes
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', requireRole('admin'), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const updateRoleSchema = z.object({
    role: z.enum(['admin', 'operator', 'viewer'])
  });

  app.patch('/api/admin/users/:id/role', requireRole('admin'), async (req: any, res) => {
    try {
      const validation = updateRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid role",
          errors: validation.error.issues
        });
      }

      const { role } = validation.data;
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Get orders with pagination and filtering
  app.get('/api/orders', requirePermission('orders.read'), async (req, res) => {
    try {
      const { search, status, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      const result = await storage.getOrders(
        search as string,
        status as string,
        limitNum,
        offset
      );
      
      res.json({
        orders: result.orders,
        total: result.total,
        page: pageNum,
        totalPages: Math.ceil(result.total / limitNum)
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });
  
  // Get order stats
  app.get('/api/orders/stats', requirePermission('orders.read'), async (req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
      res.status(500).json({ message: 'Failed to fetch order stats' });
    }
  });
  
  // Get single order
  app.get('/api/orders/:id', requirePermission('orders.read'), async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });
  
  // Create new order
  app.post('/api/orders', requirePermission('orders.create'), async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: error.errors 
        });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });
  
  // Update order
  app.patch('/api/orders/:id', requirePermission('orders.update'), async (req, res) => {
    try {
      const validatedData = updateOrderSchema.parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: error.errors 
        });
      }
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Failed to update order' });
    }
  });
  
  // Delete order
  app.delete('/api/orders/:id', requirePermission('orders.delete'), async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ message: 'Failed to delete order' });
    }
  });
  
  // Get connected clients count (admin only)
  app.get('/api/clients', requireRole('admin'), (req, res) => {
    res.json({ count: clients.size });
  });

  return httpServer;
}
