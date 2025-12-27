import { Platform } from "react-native";

const APP_VERSION = "0.5.0";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ReportErrorOptions {
  /** Error type/name (e.g., "NetworkError", "ValidationError") */
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
 * The error is formatted with structured metadata for easier debugging.
 *
 * For full error logging with Jazz CoFeed + PostHog, use the useErrorReporter hook instead.
 */
export function reportError(
  error: Error | string,
  options: ReportErrorOptions = {},
): void {
  const { type, source, severity = "error", context } = options;

  const errorMessage =
    typeof error === "string" ? error : error.message || "Unknown error";
  const errorName = type || (typeof error === "object" ? error.name : "Error");

  // Log to console - PostHog autocapture will pick up console.error calls
  // Format with metadata for structured logging
  console.error(
    JSON.stringify({
      level: severity,
      type: errorName,
      message: errorMessage,
      source: source || "unknown",
      platform: Platform.OS,
      app_version: APP_VERSION,
      ...context,
    }),
  );
}
