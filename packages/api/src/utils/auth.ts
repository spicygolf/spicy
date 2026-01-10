/**
 * Authentication & Authorization Utilities
 *
 * Helper functions for checking user permissions and roles.
 * Supports both Jazz account IDs (new) and emails (legacy).
 */

/**
 * Check if an account has admin privileges by Jazz account ID
 *
 * Admin accounts are identified by their Jazz account ID (co_z...).
 * Configure via ADMIN_ACCOUNT_IDS env var (comma-separated list).
 *
 * @param accountId - The Jazz account ID
 * @returns true if the account is an admin, false otherwise
 */
export function isAdminAccount(accountId: string | null | undefined): boolean {
  if (!accountId) {
    return false;
  }

  const adminAccountsEnv = process.env.ADMIN_ACCOUNT_IDS;
  const authorizedAccounts =
    adminAccountsEnv?.split(",").map((id) => id.trim()) || [];
  return authorizedAccounts.includes(accountId);
}

/**
 * Require admin privileges by account ID or throw an error
 *
 * @param accountId - The Jazz account ID
 * @throws Error if account is not an admin
 */
export function requireAdminAccount(
  accountId: string | null | undefined,
): asserts accountId is string {
  if (!isAdminAccount(accountId)) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * @deprecated Use isAdminAccount with Jazz account IDs instead.
 * Check if a user has admin privileges by email (legacy).
 */
export function isAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) {
    return false;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  const authorizedEmails =
    adminEmailsEnv?.split(",").map((e) => e.trim()) || [];
  return authorizedEmails.includes(userEmail.toLowerCase());
}

/**
 * @deprecated Use requireAdminAccount with Jazz account IDs instead.
 * Require admin privileges by email or throw an error (legacy).
 */
export function requireAdmin(
  userEmail: string | null | undefined,
): asserts userEmail is string {
  if (!isAdmin(userEmail)) {
    throw new Error("Unauthorized: Admin access required");
  }
}
