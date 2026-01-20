import { useEffect, useState } from "react";
import { storage } from "@/providers/jazz/mmkv-store";
import { getApiUrl } from "./useApi";

/**
 * Default error messages used when API messages aren't available.
 * These should match what's in the seed file.
 */
const DEFAULT_ERROR_MESSAGES: Record<string, string[]> = {
  error_boundary_title: [
    "Oops! The app hit into the deep rough.",
    "Sorry, the app just made a double bogey.",
  ],
};

const MMKV_KEY_PREFIX = "error_messages_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedMessages {
  locale: string;
  messages: Array<{ key: string; message: string }>;
  fetchedAt: number;
}

/**
 * Select a random item from an array
 */
function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get cached messages from MMKV
 */
function getCachedMessages(locale: string): CachedMessages | null {
  try {
    const cached = storage.getString(`${MMKV_KEY_PREFIX}${locale}`);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedMessages;
      // Check if cache is still valid
      if (Date.now() - parsed.fetchedAt < CACHE_EXPIRY_MS) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save messages to MMKV cache
 */
function cacheMessages(data: CachedMessages): void {
  try {
    storage.set(`${MMKV_KEY_PREFIX}${data.locale}`, JSON.stringify(data));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Fetch messages from API and cache them
 */
async function fetchMessages(locale: string): Promise<CachedMessages | null> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/messages/${locale}`);
    if (response.ok) {
      const data = await response.json();
      const cached: CachedMessages = {
        locale: data.locale,
        messages: data.messages,
        fetchedAt: Date.now(),
      };
      cacheMessages(cached);
      return cached;
    }
  } catch (e) {
    // Network error - fall back to cache or defaults
  }
  return null;
}

/**
 * Get a message from cached data or defaults
 */
function getMessageFromCache(
  key: string,
  cached: CachedMessages | null,
): string {
  if (cached?.messages) {
    const matching = cached.messages
      .filter((m) => m.key === key)
      .map((m) => m.message);
    if (matching.length > 0) {
      return randomChoice(matching);
    }
  }

  // Fall back to defaults
  const defaults = DEFAULT_ERROR_MESSAGES[key];
  if (defaults && defaults.length > 0) {
    return randomChoice(defaults);
  }

  return key;
}

/**
 * Hook to get error messages with API fetch + MMKV caching.
 *
 * Messages are fetched from the API and cached locally in MMKV.
 * Falls back to hardcoded defaults when:
 * - Cache is empty and API is unavailable
 * - Message key not found
 *
 * @param key - Message identifier (e.g., "error_boundary_title")
 * @param locale - Locale code (e.g., "en_US", "en_GB", "es_ES")
 * @returns A random message string for the given key
 */
export function useErrorMessages(key: string, locale = "en_US"): string {
  // Start with cached value or default
  const [message, setMessage] = useState<string>(() => {
    const cached = getCachedMessages(locale);
    return getMessageFromCache(key, cached);
  });

  useEffect(() => {
    let mounted = true;

    // Check cache first
    const cached = getCachedMessages(locale);
    if (cached) {
      // Cache hit - use it but still fetch in background to refresh
      const msg = getMessageFromCache(key, cached);
      if (mounted) setMessage(msg);
    }

    // Fetch from API (always, to keep cache fresh)
    fetchMessages(locale).then((fresh) => {
      if (mounted && fresh) {
        const msg = getMessageFromCache(key, fresh);
        setMessage(msg);
      }
    });

    return () => {
      mounted = false;
    };
  }, [key, locale]);

  return message;
}

/**
 * Get a random error title suitable for ErrorBoundary.
 * Convenience wrapper around useErrorMessages.
 */
export function useErrorTitle(locale = "en_US"): string {
  return useErrorMessages("error_boundary_title", locale);
}

/**
 * Synchronous function to get error message from cache.
 * Use this in contexts where hooks aren't available (e.g., class components).
 *
 * @param key - Message identifier
 * @param locale - Locale code
 * @returns A random message string for the given key
 */
export function getErrorMessage(key: string, locale = "en_US"): string {
  const cached = getCachedMessages(locale);
  return getMessageFromCache(key, cached);
}

/**
 * Synchronous function to get a random error title.
 * Use this in ErrorBoundary and other class components.
 */
export function getErrorTitle(locale = "en_US"): string {
  return getErrorMessage("error_boundary_title", locale);
}

/**
 * Pre-fetch and cache messages for a locale.
 * Call this at app startup to ensure messages are available.
 */
export async function prefetchErrorMessages(locale = "en_US"): Promise<void> {
  await fetchMessages(locale);
}
