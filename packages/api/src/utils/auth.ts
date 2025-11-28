/**
 * Authentication & Authorization Utilities
 *
 * Helper functions for checking user permissions and roles.
 * Uses better-auth user context from Elysia routes.
 */

/**
 * Check if a user has admin privileges
 *
 * Admin users are identified by their email address.
 * The list of admin emails can be configured via ADMIN_EMAILS env var
 * (comma-separated list) or falls back to default admin emails.
 *
 * @param userEmail - The email address from the authenticated user context
 * @returns true if the user is an admin, false otherwise
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
 * Require admin privileges or throw an error
 *
 * Convenience function for endpoints that require admin access.
 * Throws an error if the user is not an admin.
 *
 * @param userEmail - The email address from the authenticated user context
 * @throws Error if user is not an admin
 *
 * @example
 * ```ts
 * .post("/admin/action", async ({ user }) => {
 *   requireAdmin(user?.email);
 *   // ... admin-only logic
 * })
 * ```
 */
export function requireAdmin(
  userEmail: string | null | undefined,
): asserts userEmail is string {
  if (!isAdmin(userEmail)) {
    throw new Error("Unauthorized: Admin access required");
  }
}
