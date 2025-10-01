import type { RequestHandler } from "express";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private orgLimits = new Map<string, RateLimitEntry>();
  private ipLimits = new Map<string, RateLimitEntry>();

  constructor() {
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    
    this.orgLimits.forEach((entry, key) => {
      if (entry.resetTime <= now) {
        this.orgLimits.delete(key);
      }
    });
    
    this.ipLimits.forEach((entry, key) => {
      if (entry.resetTime <= now) {
        this.ipLimits.delete(key);
      }
    });
  }

  private checkLimit(
    store: Map<string, RateLimitEntry>,
    key: string,
    config: RateLimitConfig
  ): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetTime <= now) {
      store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  checkOrgLimit(orgId: string, config: RateLimitConfig) {
    return this.checkLimit(this.orgLimits, orgId, config);
  }

  checkIpLimit(ip: string, config: RateLimitConfig) {
    return this.checkLimit(this.ipLimits, ip, config);
  }
}

const rateLimiter = new RateLimiter();

export function createRateLimit(config: RateLimitConfig): RequestHandler {
  return (req: any, res, next) => {
    const ip = req.auditContext?.ipAddress || req.ip || 'unknown';
    const orgId = req.currentOrganization;

    const ipCheck = rateLimiter.checkIpLimit(ip, config);
    if (!ipCheck.allowed) {
      res.set('Retry-After', ipCheck.retryAfter!.toString());
      return res.status(429).json({
        error: 'Too many requests from this IP address',
        retryAfter: ipCheck.retryAfter,
      });
    }

    if (orgId) {
      const orgCheck = rateLimiter.checkOrgLimit(orgId, config);
      if (!orgCheck.allowed) {
        res.set('Retry-After', orgCheck.retryAfter!.toString());
        return res.status(429).json({
          error: 'Too many requests for this organization',
          retryAfter: orgCheck.retryAfter,
        });
      }
    }

    next();
  };
}

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 50,
});

export const publishRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 100,
});

export const checkoutRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
});
