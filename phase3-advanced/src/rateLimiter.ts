import { Request, Response, NextFunction } from 'express';

interface Bucket {
  tokens: number;
  lastRefilled: number;
}

// Stateful store tracking buckets in-memory. In enterprise systems, this is shunted to Redis.
const ipBuckets = new Map<string, Bucket>();

// Configuration parameters
const BUCKET_CAPACITY = 5;            // Maximum request burst capacity
const REFILL_RATE_MS = 10000;         // Refill 1 token every 10,000ms (10 seconds)

/**
 * Express middleware implementing the stateful Token-Bucket Rate Limiter.
 */
export function tokenBucketRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Fallback to generic identifier if IP is unresolved
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'anonymous';
  
  const now = Date.now();
  let bucket = ipBuckets.get(clientIp);

  // Initialize a full bucket if this is a first-time client
  if (!bucket) {
    bucket = {
      tokens: BUCKET_CAPACITY,
      lastRefilled: now,
    };
    ipBuckets.set(clientIp, bucket);
  } else {
    // 1. Calculate how many tokens have accumulated since the last transaction
    const elapsedMs = now - bucket.lastRefilled;
    const tokensToAdd = Math.floor(elapsedMs / REFILL_RATE_MS);

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(BUCKET_CAPACITY, bucket.tokens + tokensToAdd);
      // Advance lastRefilled time precisely to preserve remainder milliseconds
      bucket.lastRefilled += tokensToAdd * REFILL_RATE_MS;
    }
  }

  // 2. Evaluate request allowance
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1; // Consume one execution token
    
    // Inject standard telemetry headers
    res.setHeader('X-RateLimit-Limit', BUCKET_CAPACITY);
    res.setHeader('X-RateLimit-Remaining', bucket.tokens);
    
    next();
  } else {
    // Bucket is empty! Shunt the client with HTTP 429
    const msToWait = REFILL_RATE_MS - (now - bucket.lastRefilled);
    
    res.setHeader('X-RateLimit-Limit', BUCKET_CAPACITY);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('Retry-After', Math.ceil(msToWait / 1000));

    res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded.',
      message: `You are sending requests too quickly. Please wait ${Math.ceil(msToWait / 1000)} seconds before retrying.`,
      retryAfterMs: msToWait,
    });
  }
}
