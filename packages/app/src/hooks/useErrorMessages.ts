import { useMemo } from "react";
import { useJazzWorker } from "./useJazzWorker";

/**
 * Default error messages used when catalog messages aren't loaded yet
 * or when offline. These should match what's in the seed file.
 */
const DEFAULT_ERROR_MESSAGES: Record<string, string[]> = {
  error_boundary_title: [
    "Oops! The app hit into the deep rough.",
    "Sorry, the app just made a double bogey.",
  ],
};

/**
 * Get the language portion of a locale code (e.g., "en_US" -> "en")
 */
function getLanguageFromLocale(locale: string): string {
  return locale.split("_")[0];
}

/**
 * Select a random item from an array
 */
function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Hook to get error messages from the Jazz catalog with locale fallback.
 *
 * Messages are fetched from the worker account's public catalog and cached
 * locally via Jazz sync. Falls back to hardcoded defaults when:
 * - Catalog hasn't loaded yet (first launch, offline)
 * - Locale or message key not found
 *
 * @param key - Message identifier (e.g., "error_boundary_title")
 * @param locale - Locale code (e.g., "en_US", "en_GB", "es_ES")
 * @returns A random message string for the given key
 *
 * Fallback chain:
 * 1. Exact locale match (e.g., "en_GB")
 * 2. Language fallback (e.g., "en")
 * 3. Default locale ("en_US")
 * 4. Hardcoded defaults
 */
export function useErrorMessages(key: string, locale = "en_US"): string {
  const { account: workerAccount } = useJazzWorker({
    profile: {
      catalog: {
        errorMessages: {},
      },
    },
  });

  // Memoize the message selection to avoid re-randomizing on every render
  // Note: This means the message stays stable for the component lifecycle
  const message = useMemo(() => {
    // Navigate to errorMessages with proper null checks
    const profile = workerAccount?.profile;
    if (!profile?.$isLoaded) {
      return getDefaultMessage(key);
    }

    const catalog = profile.catalog;
    if (!catalog?.$isLoaded) {
      return getDefaultMessage(key);
    }

    const errorMessages = catalog.errorMessages;
    if (!errorMessages?.$isLoaded) {
      return getDefaultMessage(key);
    }

    // Fallback chain: exact locale -> language only -> en_US
    const language = getLanguageFromLocale(locale);
    const localesToTry = [locale, language, "en_US"];

    for (const tryLocale of localesToTry) {
      const messageList = errorMessages[tryLocale];
      if (!messageList?.$isLoaded) continue;

      // Find messages matching the key
      const matching: string[] = [];
      for (let i = 0; i < messageList.length; i++) {
        const msg = messageList[i];
        if (msg?.$isLoaded && msg.key === key) {
          matching.push(msg.message);
        }
      }

      if (matching.length > 0) {
        return randomChoice(matching);
      }
    }

    return getDefaultMessage(key);
  }, [workerAccount, key, locale]);

  return message;
}

/**
 * Get a default message for a key from hardcoded defaults
 */
function getDefaultMessage(key: string): string {
  const defaults = DEFAULT_ERROR_MESSAGES[key];
  if (defaults && defaults.length > 0) {
    return randomChoice(defaults);
  }
  return key;
}

/**
 * Get a random error title suitable for ErrorBoundary.
 * Convenience wrapper around useErrorMessages.
 */
export function useErrorTitle(locale = "en_US"): string {
  return useErrorMessages("error_boundary_title", locale);
}
