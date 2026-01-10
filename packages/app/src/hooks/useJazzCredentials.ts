import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useApi } from "@/hooks";
import { storage } from "@/providers/jazz/mmkv-store";

const CREDENTIALS_KEY = "spicy-jazz-credentials";

interface JazzCredentials {
  // Jazz cloud connection key (public, used in WebSocket URL)
  cloudKey: string;
  // Worker account ID (public, used to load shared catalog)
  workerAccount: string;
}

async function fetchJazzCredentials(api: string): Promise<JazzCredentials> {
  const url = `${api}/jazz/credentials`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error("Cannot reach Spicy Golf");
    }
    throw error;
  }
}

function getStoredCredentials(): JazzCredentials | null {
  const stored = storage.getString(CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function storeCredentials(credentials: JazzCredentials): void {
  storage.set(CREDENTIALS_KEY, JSON.stringify(credentials));
}

const JAZZ_AUTH_SECRET_KEY = "jazz-logged-in-secret";

export function clearStoredCredentials(): void {
  storage.delete(CREDENTIALS_KEY);
}

export function clearAllAuthData(): void {
  // Clear our Jazz API credentials
  storage.delete(CREDENTIALS_KEY);
  // Clear Jazz's auth secret (enables offline logout)
  storage.delete(JAZZ_AUTH_SECRET_KEY);
}

export function useJazzCredentials() {
  const api = useApi();
  // Read stored credentials synchronously on mount
  const storedCredentials = getStoredCredentials();

  const query = useQuery({
    queryKey: ["jazz-credentials"],
    queryFn: () => fetchJazzCredentials(api),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - super rare updates
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    // Use stored credentials as initial data so they persist after query errors
    initialData: storedCredentials || undefined,
    // Don't retry if we have cached credentials - work offline
    retry: storedCredentials ? false : 3,
    // Don't refetch on mount/focus - we have initialData and want stable error state
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Persist credentials when they're freshly fetched from the API
  useEffect(() => {
    if (query.data && query.isFetched && !query.isError) {
      storeCredentials(query.data);
    }
  }, [query.data, query.isFetched, query.isError]);

  // If we have valid data (from cache or fetch), suppress network errors
  // This enables offline-first behavior after initial login
  const hasValidData = !!query.data;
  const suppressError = hasValidData && query.error;

  return {
    ...query,
    // Suppress error if we have valid cached credentials (offline-first)
    error: suppressError ? null : query.error,
    // Not in error state if we have cached credentials
    isError: suppressError ? false : query.isError,
  };
}
