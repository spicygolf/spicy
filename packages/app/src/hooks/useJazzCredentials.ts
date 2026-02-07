import { JAZZ_API_KEY, JAZZ_WORKER_ACCOUNT } from "@env";
import { storage } from "@/providers/jazz/mmkv-store";

export interface JazzCredentials {
  apiKey: string;
  workerAccount: string;
}

const JAZZ_AUTH_SECRET_KEY = "jazz-logged-in-secret";

export function clearAllAuthData(): void {
  // Clear Jazz's auth secret (enables offline logout)
  storage.remove(JAZZ_AUTH_SECRET_KEY);
}

/**
 * Validates that required Jazz credentials are present.
 * Throws a descriptive error if any are missing.
 */
function validateCredentials(): void {
  const missing: string[] = [];

  if (!JAZZ_API_KEY) {
    missing.push("JAZZ_API_KEY");
  }
  if (!JAZZ_WORKER_ACCOUNT) {
    missing.push("JAZZ_WORKER_ACCOUNT");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Jazz credentials: ${missing.join(", ")}. ` +
        "Check your .env file or CI secrets configuration.",
    );
  }
}

export function useJazzCredentials(): {
  data: JazzCredentials;
  isLoading: false;
  isError: false;
  error: null;
} {
  // Validate on first use - throws if env vars are missing
  validateCredentials();

  const credentials: JazzCredentials = {
    apiKey: JAZZ_API_KEY,
    workerAccount: JAZZ_WORKER_ACCOUNT,
  };

  return {
    data: credentials,
    isLoading: false,
    isError: false,
    error: null,
  };
}
