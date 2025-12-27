import { useAccount } from "jazz-tools/react-native";
import { useCallback } from "react";
import { Platform } from "react-native";
import { ErrorEntry, ErrorLog, PlayerAccount } from "spicylib/schema";

// App version from package.json
const APP_VERSION = "0.5.0";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ReportErrorOptions {
  /** Error type/name (e.g., "NetworkError", "ValidationError") */
  type?: string;
  /** Component or function where error occurred */
  source?: string;
  /** Severity level */
  severity?: ErrorSeverity;
  /** Additional context data (will be JSON stringified) */
  context?: Record<string, unknown>;
  /** Whether to also log to console (defaults to __DEV__) */
  logToConsole?: boolean;
}

/**
 * Hook for reporting errors to Jazz CoFeed (local-first) and PostHog (when online).
 *
 * Usage:
 * ```tsx
 * const { reportError } = useErrorReporter();
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   reportError(error, { source: "riskyOperation", severity: "error" });
 * }
 * ```
 */
export function useErrorReporter() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        errorLog: true,
      },
    },
  });

  const reportError = useCallback(
    async (
      error: Error | string,
      options: ReportErrorOptions = {},
    ): Promise<void> => {
      const {
        type,
        source,
        severity = "error",
        context,
        logToConsole = __DEV__,
      } = options;

      const errorMessage =
        typeof error === "string" ? error : error.message || "Unknown error";
      const errorStack =
        typeof error === "object" && error.stack ? error.stack : undefined;
      const errorName =
        type || (typeof error === "object" ? error.name : "Error");

      // Log to console in dev
      if (logToConsole) {
        console.error(`[${severity.toUpperCase()}] ${source || "App"}:`, error);
      }

      // Write to Jazz CoFeed (local-first, syncs when online)
      if (me?.$isLoaded && me.root?.$isLoaded) {
        try {
          // Lazily create errorLog if it doesn't exist
          if (!me.root.$jazz.has("errorLog")) {
            const errorLog = ErrorLog.create([], { owner: me });
            me.root.$jazz.set("errorLog", errorLog);
          }

          const errorLog = me.root.errorLog;
          if (errorLog?.$isLoaded) {
            const entry = ErrorEntry.create(
              {
                message: errorMessage,
                type: errorName,
                stack: errorStack,
                source,
                severity,
                context: context ? JSON.stringify(context) : undefined,
                sentToPostHog: false, // Will be updated when PostHog confirms
                platform: Platform.OS,
                appVersion: APP_VERSION,
              },
              { owner: me },
            );

            errorLog.$jazz.push(entry);

            // TODO: Send to PostHog when SDK is configured
            // posthog.capture('$exception', {
            //   $exception_message: errorMessage,
            //   $exception_type: errorName,
            //   $exception_source: source,
            //   ...context
            // });
            // Then update: entry.sentToPostHog = true;
          }
        } catch (logError) {
          // Don't let error logging cause more errors
          if (__DEV__) {
            console.error("Failed to log error to Jazz:", logError);
          }
        }
      }
    },
    [me],
  );

  /**
   * Wrap an async function to automatically report errors
   */
  const withErrorReporting = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(
      fn: T,
      source: string,
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await fn(...args);
        } catch (error) {
          reportError(error as Error, { source });
          throw error; // Re-throw so caller can handle
        }
      }) as T;
    },
    [reportError],
  );

  return {
    reportError,
    withErrorReporting,
  };
}
