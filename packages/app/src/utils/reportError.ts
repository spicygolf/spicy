import { Platform } from "react-native";
import type { ErrorSeverity } from "spicylib/schema";
import { APP_VERSION } from "@/constants/version";

export type { ErrorSeverity };

export interface ReportErrorOptions {
  /** Error type/name override (e.g., "NetworkError", "ValidationError") */
  type?: string;
  /** Component or function where error occurred */
  source?: string;
  /** Severity level */
  severity?: ErrorSeverity;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Report an error (standalone function, can be called from anywhere).
 *
 * This logs to console.error which PostHog's autocapture will pick up.
 * PostHog autocapture expects an Error object to capture stack traces properly.
 *
 * For error reporting with user context (jazz_account_id), use the useErrorReporter hook instead.
 */
export function reportError(
  error: Error | string,
  options: ReportErrorOptions = {},
): void {
  const { source, severity = "error", context } = options;

  // Ensure we have an Error object for PostHog autocapture to get stack traces
  const errorObj = typeof error === "string" ? new Error(error) : error;

  // Log to console - PostHog autocapture will pick up console.error calls
  // Pass the actual Error object so PostHog can capture the stack trace
  console.error(
    `[${severity.toUpperCase()}] ${source || "unknown"}:`,
    errorObj,
    context
      ? {
          platform: Platform.OS,
          app_version: APP_VERSION,
          ...context,
        }
      : { platform: Platform.OS, app_version: APP_VERSION },
  );
}
