/**
 * Worker Account Authentication
 *
 * Utilities for checking the JAZZ_WORKER_ACCOUNT
 * This account owns the shared GameCatalog.
 * Note: The web client only needs the account ID to READ the public catalog.
 * Catalog modifications happen server-side via the API.
 */

/**
 * Get worker account ID from environment
 */
export function getWorkerAccountId(): string | null {
  const accountID = import.meta.env.VITE_JAZZ_WORKER_ACCOUNT;

  if (!accountID) {
    console.warn(
      "Worker account ID not found in environment. Set VITE_JAZZ_WORKER_ACCOUNT.",
    );
    return null;
  }

  return accountID;
}

/**
 * Check if currently authenticated as worker account
 */
export function isWorkerAccount(currentAccountId?: string): boolean {
  const workerAccountId = getWorkerAccountId();
  if (!workerAccountId || !currentAccountId) {
    return false;
  }

  return currentAccountId === workerAccountId;
}

/**
 * Check if user is authorized to perform admin operations
 * Currently limited to Brad Anderson's email addresses
 */
export function isAuthorizedAdmin(userEmail?: string): boolean {
  if (!userEmail) {
    return false;
  }

  const authorizedEmails = ["brad@sankatygroup.com", "brad@druid.golf"];

  return authorizedEmails.includes(userEmail.toLowerCase());
}
