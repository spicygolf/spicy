/**
 * Tests for Rate Limiting Utility
 */

import { describe, expect, test } from "bun:test";
import {
  checkRateLimit,
  cleanupExpiredEntries,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "./rate-limit";

describe("checkRateLimit", () => {
  // Clean up between tests by using unique account IDs
  let testCounter = 0;
  const getTestAccountId = () => `test-account-${Date.now()}-${testCounter++}`;

  test("allows first request for new account", () => {
    const accountId = getTestAccountId();
    const result = checkRateLimit(accountId, "ghin/players/search");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(RATE_LIMITS["ghin/players/search"].max);
    expect(result.remaining).toBe(RATE_LIMITS["ghin/players/search"].max - 1);
    expect(result.resetAt).toBeGreaterThan(0);
    expect(result.retryAfter).toBeUndefined();
  });

  test("tracks requests within window", () => {
    const accountId = getTestAccountId();
    const maxRequests = RATE_LIMITS["ghin/players/search"].max;

    // Make multiple requests
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(accountId, "ghin/players/search");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - (i + 1));
    }
  });

  test("blocks requests when limit exceeded", () => {
    const accountId = getTestAccountId();
    const maxRequests = RATE_LIMITS["ghin/players/search"].max;

    // Exhaust the limit
    for (let i = 0; i < maxRequests; i++) {
      const result = checkRateLimit(accountId, "ghin/players/search");
      expect(result.allowed).toBe(true);
    }

    // Next request should be blocked
    const blocked = checkRateLimit(accountId, "ghin/players/search");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  test("different endpoints have separate limits", () => {
    const accountId = getTestAccountId();

    // Use up some of player search limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(accountId, "ghin/players/search");
    }

    // Course search should still be at full limit
    const courseResult = checkRateLimit(accountId, "ghin/courses/search");
    expect(courseResult.allowed).toBe(true);
    expect(courseResult.remaining).toBe(
      RATE_LIMITS["ghin/courses/search"].max - 1,
    );
  });

  test("different accounts have separate limits", () => {
    const account1 = getTestAccountId();
    const account2 = getTestAccountId();

    // Use up account1's limit
    const max = RATE_LIMITS["ghin/players/search"].max;
    for (let i = 0; i < max; i++) {
      checkRateLimit(account1, "ghin/players/search");
    }

    // Account1 should be blocked
    expect(checkRateLimit(account1, "ghin/players/search").allowed).toBe(false);

    // Account2 should be allowed
    expect(checkRateLimit(account2, "ghin/players/search").allowed).toBe(true);
  });

  test("returns allowed for unknown endpoint (no limit configured)", () => {
    const accountId = getTestAccountId();
    const result = checkRateLimit(accountId, "unknown/endpoint");

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(0);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toBe(0);
  });

  test("verifies configured rate limits", () => {
    // Ensure our expected endpoints are configured
    expect(RATE_LIMITS["ghin/players/search"]).toBeDefined();
    expect(RATE_LIMITS["ghin/courses/search"]).toBeDefined();
    expect(RATE_LIMITS["ghin/courses/details"]).toBeDefined();
    expect(RATE_LIMITS["ghin/countries"]).toBeDefined();

    // Check values are reasonable
    expect(RATE_LIMITS["ghin/players/search"].max).toBeGreaterThan(0);
    expect(RATE_LIMITS["ghin/players/search"].windowMs).toBe(60_000);
  });
});

describe("getRateLimitHeaders", () => {
  test("returns standard rate limit headers", () => {
    const result = {
      allowed: true,
      limit: 30,
      remaining: 25,
      resetAt: 1704067260,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe(30);
    expect(headers["X-RateLimit-Remaining"]).toBe(25);
    expect(headers["X-RateLimit-Reset"]).toBe(1704067260);
    expect(headers["Retry-After"]).toBeUndefined();
  });

  test("includes Retry-After when request not allowed", () => {
    const result = {
      allowed: false,
      limit: 30,
      remaining: 0,
      resetAt: 1704067260,
      retryAfter: 45,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["Retry-After"]).toBe(45);
  });
});

describe("cleanupExpiredEntries", () => {
  test("returns count of cleaned entries", () => {
    // Just verify the function runs without error
    // Actual cleanup depends on internal state which is hard to test in isolation
    const cleaned = cleanupExpiredEntries();
    expect(typeof cleaned).toBe("number");
    expect(cleaned).toBeGreaterThanOrEqual(0);
  });
});
