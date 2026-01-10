/**
 * Tests for Jazz Authentication Middleware
 */

import { describe, expect, test } from "bun:test";
import { authenticateJazzRequest } from "./jazz-auth";

describe("authenticateJazzRequest", () => {
  test("rejects request without auth header", async () => {
    const request = new Request("http://localhost/test", {
      method: "GET",
    });

    const result = await authenticateJazzRequest(request);

    expect(result.account).toBeNull();
    expect(result.accountId).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
    expect(result.error?.message).toBe("No authorization header");
  });

  test("rejects request with wrong auth format (Bearer)", async () => {
    const request = new Request("http://localhost/test", {
      method: "GET",
      headers: {
        Authorization: "Bearer some-token",
      },
    });

    const result = await authenticateJazzRequest(request);

    expect(result.account).toBeNull();
    expect(result.accountId).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
    expect(result.error?.message).toContain("Invalid authorization format");
  });

  test("rejects request with wrong auth format (Basic)", async () => {
    const request = new Request("http://localhost/test", {
      method: "GET",
      headers: {
        Authorization: "Basic dXNlcjpwYXNz",
      },
    });

    const result = await authenticateJazzRequest(request);

    expect(result.account).toBeNull();
    expect(result.error?.status).toBe(401);
    expect(result.error?.message).toContain("Invalid authorization format");
  });

  test("rejects request with empty Jazz token", async () => {
    const request = new Request("http://localhost/test", {
      method: "GET",
      headers: {
        Authorization: "Jazz ",
      },
    });

    const result = await authenticateJazzRequest(request);

    // Empty token should fail verification
    expect(result.account).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
  });

  test("rejects request with malformed Jazz token", async () => {
    const request = new Request("http://localhost/test", {
      method: "GET",
      headers: {
        Authorization: "Jazz invalid-token-format",
      },
    });

    const result = await authenticateJazzRequest(request);

    expect(result.account).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(401);
  });

  // Note: Testing valid tokens requires a real Jazz account and is done in integration tests.
  // The authenticateRequest function from jazz-tools handles the cryptographic verification.
});
