import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Firestore } from 'firebase-admin/firestore';

type RateLimitOptions = {
  scope: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitDecision = { allowed: boolean; remaining: number; retryAfterSeconds: number };

const memoryBuckets = new Map<string, { count: number; windowStart: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : request.ip || request.socket.remoteAddress || 'unknown';
  return createHash('sha256').update(rawIp).digest('hex');
}

function bucketKey(scope: string, clientHash: string, windowStart: number): string {
  return createHash('sha256').update(`${scope}:${clientHash}:${windowStart}`).digest('hex');
}

function evaluateMemory(key: string, options: RateLimitOptions, now: number): RateLimitDecision {
  const windowStart = now - (now % options.windowMs);
  const bucket = memoryBuckets.get(key);
  const current = !bucket || bucket.windowStart !== windowStart ? 0 : bucket.count;
  const nextCount = current + 1;
  memoryBuckets.set(key, { count: nextCount, windowStart });
  return {
    allowed: nextCount <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - nextCount),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + options.windowMs - now) / 1000)),
  };
}

async function evaluateFirestore(db: Firestore, request: Request, options: RateLimitOptions): Promise<RateLimitDecision> {
  const now = Date.now();
  const windowStart = now - (now % options.windowMs);
  const clientHash = clientKey(request);
  const key = bucketKey(options.scope, clientHash, windowStart);
  const rateLimitRef = db.collection('api_rate_limits').doc(key);

  return db.runTransaction(async (transaction) => {
    const current = await transaction.get(rateLimitRef);
    const count = current.exists && current.data()?.windowStart === windowStart && typeof current.data()?.count === 'number'
      ? current.data()!.count
      : 0;
    const nextCount = count + 1;
    transaction.set(rateLimitRef, {
      scope: options.scope,
      clientHash,
      windowStart,
      count: nextCount,
      expiresAt: new Date(windowStart + (options.windowMs * 2)),
      updatedAt: new Date(now),
    }, { merge: true });

    return {
      allowed: nextCount <= options.maxRequests,
      remaining: Math.max(0, options.maxRequests - nextCount),
      retryAfterSeconds: Math.max(1, Math.ceil((windowStart + options.windowMs - now) / 1000)),
    };
  });
}

/**
 * Enforces a short fixed-window limit without retaining raw IP addresses. The
 * Firestore branch provides a shared counter across production instances. The
 * in-memory fallback is intentionally used only by isolated tests or when the
 * backing service is unavailable; it keeps the public surface throttled rather
 * than allowing a protection failure to become an unlimited endpoint.
 */
export function createPublicRateLimit(db: Firestore, options: RateLimitOptions) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const now = Date.now();
    const localKey = bucketKey(options.scope, clientKey(request), now - (now % options.windowMs));
    let decision: RateLimitDecision;

    try {
      decision = typeof (db as unknown as { runTransaction?: unknown }).runTransaction === 'function'
        ? await evaluateFirestore(db, request, options)
        : evaluateMemory(localKey, options, now);
    } catch (error) {
      console.error(`Rate-limit storage unavailable for ${options.scope}:`, error);
      decision = evaluateMemory(localKey, options, now);
    }

    response.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    response.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    if (decision.allowed) {
      next();
      return;
    }

    response.setHeader('Retry-After', String(decision.retryAfterSeconds));
    response.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Please pause briefly before continuing with Moodoor.',
      },
    });
  };
}

export function perMinuteLimit(scope: string, defaultLimit: number, environmentName: string): RateLimitOptions {
  const requested = Number(process.env[environmentName]);
  const maxRequests = Number.isInteger(requested) && requested > 0 && requested <= 10_000 ? requested : defaultLimit;
  return { scope, maxRequests, windowMs: 60_000 };
}
