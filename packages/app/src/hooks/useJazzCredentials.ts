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
  });

  // Persist credentials when they're fetched
  useEffect(() => {
    if (query.data) {
      storeCredentials(query.data);
    }
  }, [query.data]);

  // Return stored credentials immediately if available, otherwise wait for fetch
  return {
    ...query,
    data: query.data || storedCredentials || undefined,
  };
}
