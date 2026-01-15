import { JAZZ_API_KEY, JAZZ_WORKER_ACCOUNT } from "@env";
import { storage } from "@/providers/jazz/mmkv-store";

export interface JazzCredentials {
  apiKey: string;
  workerAccount: string;
}

const JAZZ_AUTH_SECRET_KEY = "jazz-logged-in-secret";

export function clearAllAuthData(): void {
  // Clear Jazz's auth secret (enables offline logout)
  storage.delete(JAZZ_AUTH_SECRET_KEY);
}

export function useJazzCredentials() {
  // Read credentials from environment variables (set at build time)
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
