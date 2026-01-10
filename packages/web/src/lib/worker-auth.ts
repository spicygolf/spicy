/**
 * Worker Account Authentication
 *
 * Utilities for checking the JAZZ_WORKER_ACCOUNT.
 * This account owns the shared GameCatalog.
 * Note: The web client only needs the account ID to READ the public catalog.
 * Catalog modifications happen server-side via the API with proper authentication.
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
 * Check if account is an admin via API call
 * This keeps admin list server-side for security
 */
export async function checkIsAdmin(apiUrl: string): Promise<boolean> {
  try {
    // Import dynamically to avoid issues if jazz-tools isn't loaded yet
    const { generateAuthToken } = await import("jazz-tools");
    const token = generateAuthToken();

    const response = await fetch(`${apiUrl}/auth/is-admin`, {
      headers: {
        Authorization: `Jazz ${token}`,
      },
    });
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.isAdmin === true;
  } catch (e) {
    console.warn("[checkIsAdmin] Error:", e);
    return false;
  }
}
