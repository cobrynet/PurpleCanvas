import type { RequestHandler } from "express";
import { storage } from "./storage";

export interface AuditContext {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
}

export function captureAuditContext(): RequestHandler {
  return (req: any, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    req.auditContext = {
      ipAddress: Array.isArray(ip) ? ip[0] : ip,
      userAgent,
    };

    next();
  };
}

export async function logAudit(
  organizationId: string,
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | undefined,
  ipAddress: string | undefined,
  userAgent: string | undefined,
  metadata?: any
): Promise<void> {
  try {
    await storage.createAuditLog({
      organizationId,
      userId: userId || undefined,
      action,
      entity,
      entityId,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function createAuditLogger(action: string, entity: string) {
  return async (
    req: any,
    organizationId: string,
    entityId?: string,
    metadata?: any
  ) => {
    const userId = req.user?.id || req.user?.claims?.sub || null;
    const { ipAddress, userAgent } = req.auditContext || {};
    
    await logAudit(
      organizationId,
      userId,
      action,
      entity,
      entityId,
      ipAddress,
      userAgent,
      metadata
    );
  };
}
