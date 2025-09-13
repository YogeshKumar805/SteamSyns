import { orders, users, type Order, type InsertOrder, type UpdateOrder, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Order methods
  getOrders(search?: string, status?: string, limit?: number, offset?: number): Promise<{ orders: Order[], total: number }>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: UpdateOrder): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getOrderStats(): Promise<{
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    revenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        role: role as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getOrders(search?: string, status?: string, limit = 50, offset = 0): Promise<{ orders: Order[], total: number }> {
    let query = db.select().from(orders);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`),
          ilike(orders.productName, `%${search}%`),
          ilike(orders.id, `%${search}%`)
        )
      );
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as any));
    }
    
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : sql`${conditions.join(' AND ')}`;
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }
    
    const [ordersResult, countResult] = await Promise.all([
      query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);
    
    return {
      orders: ordersResult,
      total: countResult[0]?.count || 0
    };
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newOrder;
  }

  async updateOrder(id: string, order: UpdateOrder): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...order,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    revenue: number;
  }> {
    const [statsResult] = await db.select({
      totalOrders: sql<number>`count(*)`,
      activeOrders: sql<number>`count(*) filter (where status in ('pending', 'processing', 'shipped'))`,
      completedOrders: sql<number>`count(*) filter (where status = 'delivered')`,
      revenue: sql<number>`coalesce(sum(amount::numeric) filter (where status = 'delivered'), 0)`,
    }).from(orders);

    return {
      totalOrders: statsResult?.totalOrders || 0,
      activeOrders: statsResult?.activeOrders || 0,
      completedOrders: statsResult?.completedOrders || 0,
      revenue: Number(statsResult?.revenue || 0),
    };
  }
}

export const storage = new DatabaseStorage();
