import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Minimal in-memory fixed-window limiter, keyed by client IP by default.
 * Matches the pattern already used for admin login throttling in routes.ts.
 * Not shared across multiple server instances; sufficient for the current
 * single-process deployment (see PROJECT_ETERNAL_DATABASE_ASSESSMENT.md for
 * the planned shared-state migration alongside MySQL).
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
}) {
  const buckets = new Map<string, Bucket>();
  const { windowMs, max, keyPrefix, message } = options;

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    // Periodic sweep so the map cannot grow unbounded under sustained traffic.
    if (buckets.size > 5000) {
      for (const [key, bucket] of buckets.entries()) {
        if (now > bucket.resetAt) buckets.delete(key);
      }
    }

    const key = `${keyPrefix}:${req.ip || 'unknown'}`;
    const bucket = buckets.get(key);
    if (bucket && now < bucket.resetAt) {
      if (bucket.count >= max) {
        const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(retryAfterSeconds));
        res.status(429).json({
          error: message || 'Too many requests. Please slow down and try again shortly.',
          code: 'RATE_LIMITED',
          retryAfterSeconds,
        });
        return;
      }
      bucket.count += 1;
    } else {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    }
    next();
  };
}
