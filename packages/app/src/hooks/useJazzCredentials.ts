import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { MMKV } from "react-native-mmkv";
import { useApi } from "@/hooks";

const storage = new MMKV({
  id: "spicygolf.jazz-credentials",
});

const CREDENTIALS_KEY = "jazz-credentials";

interface JazzCredentials {
  apiKey: string;
  workerAccount: string;
}

async function fetchJazzCredentials(api: string): Promise<JazzCredentials> {
  const url = `${api}/jazz/credentials`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.message;
      throw new Error(
        `Cannot reach API at ${url}\n${status ? `Status: ${status}\n` : ""}${message}`,
      );
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

export function clearStoredCredentials(): void {
  storage.delete(CREDENTIALS_KEY);
}

export function useJazzCredentials() {
  const api = useApi();
  const storedCredentials = getStoredCredentials();

  const query = useQuery({
    queryKey: ["jazz-credentials"],
    queryFn: () => fetchJazzCredentials(api),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - super rare updates
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    // Return stored credentials immediately while refetching in background
    placeholderData: storedCredentials || undefined,
    // If we have stored credentials, fetch in background without blocking
    enabled: true,
    // Don't retry if we have cached credentials - work offline
    retry: storedCredentials ? false : 3,
  });

  // Persist credentials when they're fetched
  useEffect(() => {
    if (query.data) {
      storeCredentials(query.data);
    }
  }, [query.data]);

  // If we have stored credentials, suppress errors and use cached data
  // This enables offline-first behavior after initial login
  const hasValidData = query.data || storedCredentials;
  const suppressError = hasValidData && query.error;

  return {
    ...query,
    data: query.data || storedCredentials || undefined,
    // Suppress error if we have valid cached credentials (offline-first)
    error: suppressError ? null : query.error,
    // Not in error state if we have cached credentials
    isError: suppressError ? false : query.isError,
  };
}
