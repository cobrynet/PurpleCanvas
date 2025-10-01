import type { RequestHandler } from "express";

interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
}

export function cacheControl(config: CacheConfig): RequestHandler {
  return (req, res, next) => {
    const { maxAge, staleWhileRevalidate } = config;
    
    let cacheHeader = `private, max-age=${maxAge}`;
    
    if (staleWhileRevalidate) {
      cacheHeader += `, stale-while-revalidate=${staleWhileRevalidate}`;
    }
    
    res.setHeader('Cache-Control', cacheHeader);
    res.setHeader('Vary', 'Cookie');
    next();
  };
}

export const dashboardCache = cacheControl({
  maxAge: 60,
  staleWhileRevalidate: 120,
});

export const listCache = cacheControl({
  maxAge: 120,
  staleWhileRevalidate: 180,
});

export const kpiCache = cacheControl({
  maxAge: 300,
  staleWhileRevalidate: 600,
});
