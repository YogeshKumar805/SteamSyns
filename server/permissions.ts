import type { RequestHandler } from "express";

// Define role hierarchy and permissions
export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator', 
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'orders.create',
    'orders.read', 
    'orders.update',
    'orders.delete',
    'users.read',
    'users.update',
    'users.delete',
    'admin.dashboard',
    'system.monitor'
  ],
  [ROLES.OPERATOR]: [
    'orders.create',
    'orders.read',
    'orders.update',
    'orders.delete'
  ],
  [ROLES.VIEWER]: [
    'orders.read'
  ]
} as const;

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission as any);
}

// Middleware to check if user has required permission
export function requirePermission(permission: string): RequestHandler {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Get user from database to check role
      const { storage } = await import('./storage');
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!hasPermission(user.role as UserRole, permission)) {
        return res.status(403).json({ 
          message: "Insufficient permissions",
          required: permission,
          userRole: user.role
        });
      }

      // Attach user to request for further use
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Middleware to check if user has any of the required roles
export function requireRole(...roles: UserRole[]): RequestHandler {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { storage } = await import('./storage');
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!roles.includes(user.role as UserRole)) {
        return res.status(403).json({ 
          message: "Insufficient role",
          required: roles,
          userRole: user.role
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}