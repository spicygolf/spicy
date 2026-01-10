/**
 * API Client with Jazz Authentication
 *
 * Provides an axios instance that automatically adds Jazz auth tokens
 * to all requests. Tokens are generated fresh for each request (1 min expiry).
 */

import axios from "axios";
import { generateAuthToken } from "jazz-tools";
import { getApiUrl } from "@/hooks/useApi";

/**
 * Axios instance configured with Jazz auth interceptor.
 * Use this for all API calls that require authentication.
 */
export const apiClient = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to add Jazz auth token
 *
 * Generates a fresh token for each request since tokens expire in 1 minute.
 * Token format: signature~accountId~timestamp
 */
apiClient.interceptors.request.use(
  (config) => {
    try {
      // generateAuthToken() uses the current active Jazz account
      const token = generateAuthToken();
      config.headers.Authorization = `Jazz ${token}`;
    } catch (error) {
      // If no active account, continue without auth header
      // The API will return 401 which can be handled by the caller
      console.warn("[api-client] Could not generate auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor to handle auth errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.warn(
          "[api-client] Authentication failed - user may need to log in",
        );
        // Could emit an event here for the app to handle re-authentication
      }
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers["retry-after"];
        console.warn(`[api-client] Rate limited. Retry after ${retryAfter}s`);
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Helper to make authenticated GET requests
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(path);
  return response.data;
}

/**
 * Helper to make authenticated POST requests
 */
export async function apiPost<T, D = unknown>(
  path: string,
  data?: D,
): Promise<T> {
  const response = await apiClient.post<T>(path, data);
  return response.data;
}
