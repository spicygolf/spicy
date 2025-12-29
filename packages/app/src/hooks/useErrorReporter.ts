import { useAccount } from "jazz-tools/react-native";
import { usePostHog } from "posthog-react-native";
import { useCallback } from "react";
import { Platform } from "react-native";
import { ErrorEntry, type ErrorSeverity, PlayerAccount } from "spicylib/schema";
import { APP_VERSION } from "@/constants/version";

/**
 * Safely stringify an object, handling circular references and non-serializable values.
 */
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ error: "Failed to stringify context" });
  }
}

export type { ErrorSeverity };

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
  const posthog = usePostHog();

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
      // errorLog is initialized in account migration, so it should always exist
      if (me?.$isLoaded && me.root?.$isLoaded && me.root.errorLog?.$isLoaded) {
        try {
          const errorLog = me.root.errorLog;
          const entry = ErrorEntry.create(
            {
              message: errorMessage,
              type: errorName,
              stack: errorStack,
              source,
              severity,
              context: context ? safeStringify(context) : undefined,
              platform: Platform.OS,
              appVersion: APP_VERSION,
            },
            { owner: me },
          );

          errorLog.$jazz.push(entry);

          // Send to PostHog (PostHog handles its own retry logic)
          if (posthog) {
            posthog.capture("$exception", {
              $exception_message: errorMessage,
              $exception_type: errorName,
              $exception_source: source || "unknown",
              severity,
              platform: Platform.OS,
              app_version: APP_VERSION,
              jazz_account_id: me.$jazz.id,
              ...context,
            });
          }
        } catch (logError) {
          // Don't let error logging cause more errors
          if (__DEV__) {
            console.error("Failed to log error to Jazz:", logError);
          }
        }
      }
    },
    [me, posthog],
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
