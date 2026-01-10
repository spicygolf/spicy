/**
 * Jazz Authentication Middleware
 *
 * Stateless authentication using Jazz's Ed25519 token verification.
 * No database required - tokens are cryptographically verified.
 */

import { type Account, authenticateRequest } from "jazz-tools";

/**
 * Result from Jazz authentication
 */
export interface JazzAuthResult {
  /** The authenticated Jazz account (if successful) */
  account: Account | null;
  /** Account ID string for convenience */
  accountId: string | null;
  /** Error details if authentication failed */
  error: { message: string; status: number } | null;
}

/**
 * Authenticate a request using Jazz tokens
 *
 * Expects Authorization header: "Jazz <token>"
 * Token format: signature~accountId~timestamp
 *
 * @param request - The incoming HTTP request
 * @returns Authentication result with account or error
 */
export async function authenticateJazzRequest(
  request: Request,
): Promise<JazzAuthResult> {
  const authHeader = request.headers.get("Authorization");

  // No auth header = unauthenticated request
  if (!authHeader) {
    return {
      account: null,
      accountId: null,
      error: { message: "No authorization header", status: 401 },
    };
  }

  // Must be Jazz token format
  if (!authHeader.startsWith("Jazz ")) {
    return {
      account: null,
      accountId: null,
      error: {
        message: "Invalid authorization format. Expected: Jazz <token>",
        status: 401,
      },
    };
  }

  try {
    const { account, error } = await authenticateRequest(request, {
      expiration: 60_000, // 1 minute token validity
    });

    if (error) {
      return {
        account: null,
        accountId: null,
        error: { message: error.message, status: 401 },
      };
    }

    if (!account) {
      return {
        account: null,
        accountId: null,
        error: { message: "No account in token", status: 401 },
      };
    }

    return {
      account: account,
      accountId: account.$jazz.id,
      error: null,
    };
  } catch (err) {
    console.error("Jazz auth error:", err);
    return {
      account: null,
      accountId: null,
      error: {
        message: err instanceof Error ? err.message : "Authentication failed",
        status: 401,
      },
    };
  }
}
