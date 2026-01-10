/**
 * Rate Limiting Utility
 *
 * Simple in-memory per-account rate limiter.
 * Edge-compatible - no external dependencies.
 * Resets on deploy (acceptable for non-critical rate limiting).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
}

// In-memory store (resets on deploy)
const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Rate limit configurations per endpoint pattern
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ghin/players/search": { max: 30, windowMs: 60_000 }, // 30/min
  "ghin/courses/search": { max: 30, windowMs: 60_000 }, // 30/min
  "ghin/courses/details": { max: 60, windowMs: 60_000 }, // 60/min (course setup)
  "ghin/countries": { max: 10, windowMs: 60_000 }, // 10/min (rarely needed)
};

/**
 * Result from rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Maximum requests in window */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the limit resets */
  resetAt: number;
  /** Seconds until retry (only if not allowed) */
  retryAfter?: number;
}

/**
 * Check if a request is within rate limits
 *
 * @param accountId - The Jazz account ID making the request
 * @param endpoint - The endpoint pattern (e.g., "ghin/players/search")
 * @returns Rate limit result with headers info
 */
export function checkRateLimit(
  accountId: string,
  endpoint: string,
): RateLimitResult {
  const config = RATE_LIMITS[endpoint];

  // No rate limit configured for this endpoint
  if (!config) {
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetAt: 0,
    };
  }

  const key = `${accountId}:${endpoint}`;
  const now = Date.now();

  const entry = rateLimits.get(key);

  // No entry or window expired - create new window
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.max,
      remaining: config.max - 1,
      resetAt: Math.floor(resetAt / 1000),
    };
  }

  // Within window - check count
  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetAt: Math.floor(entry.resetAt / 1000),
      retryAfter,
    };
  }

  // Increment and allow
  entry.count++;
  return {
    allowed: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetAt: Math.floor(entry.resetAt / 1000),
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string | number> {
  const headers: Record<string, string | number> = {
    "X-RateLimit-Limit": result.limit,
    "X-RateLimit-Remaining": result.remaining,
    "X-RateLimit-Reset": result.resetAt,
  };

  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = result.retryAfter;
  }

  return headers;
}

/**
 * Clean up expired entries (call periodically to prevent memory leak)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Clean up every 5 minutes
setInterval(
  () => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[rate-limit] Cleaned up ${cleaned} expired entries`);
    }
  },
  5 * 60 * 1000,
);
