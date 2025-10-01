import type { RequestHandler } from "express";
import { sendForbidden } from './errors';

export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MARKETER' | 'SALES' | 'VIEWER' | 'VENDOR';
export type Module = 'marketing' | 'marketing_adv' | 'marketing_offline' | 'crm' | 'goals' | 'marketplace' | 'settings' | 'chat';
export type Action = 'read' | 'create' | 'update' | 'delete';

const rolePermissions: Record<Role, Record<Module, Action[]>> = {
  SUPER_ADMIN: {
    marketing: ['read', 'create', 'update', 'delete'],
    marketing_adv: ['read', 'create', 'update', 'delete'],
    marketing_offline: ['read', 'create', 'update', 'delete'],
    crm: ['read', 'create', 'update', 'delete'],
    goals: ['read', 'create', 'update', 'delete'],
    marketplace: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'create', 'update', 'delete'],
    chat: ['read', 'create', 'update', 'delete'],
  },
  ORG_ADMIN: {
    marketing: ['read', 'create', 'update', 'delete'],
    marketing_adv: ['read', 'create', 'update', 'delete'],
    marketing_offline: ['read', 'create', 'update', 'delete'],
    crm: ['read', 'create', 'update', 'delete'],
    goals: ['read', 'create', 'update', 'delete'],
    marketplace: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'create', 'update', 'delete'],
    chat: ['read', 'create', 'update', 'delete'],
  },
  MARKETER: {
    marketing: ['read', 'create', 'update', 'delete'],
    marketing_adv: ['read', 'create', 'update', 'delete'],
    marketing_offline: ['read', 'create', 'update', 'delete'],
    crm: [],
    goals: ['read'],
    marketplace: ['read', 'create'],
    settings: ['read'],
    chat: ['read', 'create', 'update'],
  },
  SALES: {
    marketing: [],
    marketing_adv: [],
    marketing_offline: [],
    crm: ['read', 'create', 'update', 'delete'],
    goals: ['read'],
    marketplace: ['read', 'create'],
    settings: ['read'],
    chat: ['read', 'create', 'update'],
  },
  VIEWER: {
    marketing: ['read'],
    marketing_adv: ['read'],
    marketing_offline: ['read'],
    crm: ['read'],
    goals: ['read'],
    marketplace: ['read'],
    settings: ['read'],
    chat: ['read'],
  },
  VENDOR: {
    marketing: [],
    marketing_adv: [],
    marketing_offline: [],
    crm: [],
    goals: [],
    marketplace: ['read'], // Vendors can only read marketplace orders assigned to them
    settings: ['read'],
    chat: ['read', 'create', 'update'],
  },
};

export function hasPermission(role: Role, module: Module, action: Action): boolean {
  const modulePermissions = rolePermissions[role]?.[module] || [];
  return modulePermissions.includes(action);
}

export function requirePermission(module: Module, action: Action = 'read'): RequestHandler {
  return (req: any, res, next) => {
    if (!req.currentMembership) {
      return sendForbidden(res, "No organization membership found");
    }

    const userRole = req.currentMembership.role as Role;
    
    if (hasPermission(userRole, module, action)) {
      return next();
    }

    return sendForbidden(res, `Your role (${userRole}) does not have permission to ${action} ${module} resources`);
  };
}

export function requireAnyPermission(checks: { module: Module; action: Action }[]): RequestHandler {
  return (req: any, res, next) => {
    if (!req.currentMembership) {
      return sendForbidden(res, "No organization membership found");
    }

    const userRole = req.currentMembership.role as Role;
    
    const hasAnyPermission = checks.some(check => 
      hasPermission(userRole, check.module, check.action)
    );

    if (hasAnyPermission) {
      return next();
    }

    return sendForbidden(res, `Your role (${userRole}) does not have the required permissions for this action`);
  };
}
