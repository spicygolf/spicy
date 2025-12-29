import { useAccount } from "jazz-tools/react-native";
import { usePostHog } from "posthog-react-native";
import { useCallback } from "react";
import { Platform } from "react-native";
import { type ErrorSeverity, PlayerAccount } from "spicylib/schema";
import { APP_VERSION } from "@/constants/version";

export type { ErrorSeverity };

export interface ReportErrorOptions {
  /** Error type/name (e.g., "NetworkError", "ValidationError") */
  type?: string;
  /** Component or function where error occurred */
  source?: string;
  /** Severity level */
  severity?: ErrorSeverity;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Whether to also log to console (defaults to __DEV__) */
  logToConsole?: boolean;
}

/**
 * Hook for reporting errors to PostHog with user context.
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
  const me = useAccount(PlayerAccount);
  const posthog = usePostHog();

  const reportError = useCallback(
    (error: Error | string, options: ReportErrorOptions = {}): void => {
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

      // Send to PostHog
      if (posthog) {
        posthog.capture("$exception", {
          $exception_message: errorMessage,
          $exception_type: errorName,
          $exception_source: source || "unknown",
          severity,
          platform: Platform.OS,
          app_version: APP_VERSION,
          ...(errorStack && { $exception_stack_trace: errorStack }),
          ...(me?.$isLoaded && { jazz_account_id: me.$jazz.id }),
          ...context,
        });
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
