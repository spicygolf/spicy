import { co, z } from "jazz-tools";

/** Error severity levels */
export type ErrorSeverity = "error" | "warning" | "info";

/**
 * ErrorEntry - A single error event
 * Stored in a CoFeed for append-only history with automatic timestamps
 *
 * Jazz CoFeed provides: createdAt, session/account attribution, ordering
 */
export const ErrorEntry = co.map({
  /** Error message (user-friendly) */
  message: z.string(),

  /** Error name/type (e.g., "TypeError", "NetworkError") */
  type: z.string().optional(),

  /** Stack trace (for debugging) */
  stack: z.string().optional(),

  /** Component/function where error occurred */
  source: z.string().optional(),

  /** Severity level */
  severity: z.enum(["error", "warning", "info"]).optional(),

  /** Additional context (JSON stringified) */
  context: z.string().optional(),

  /** Device/platform info */
  platform: z.string().optional(),

  /** App version */
  appVersion: z.string().optional(),
});
export type ErrorEntry = co.loaded<typeof ErrorEntry>;

/**
 * ErrorLog - Append-only feed of error events
 * Local-first: errors are stored immediately, synced when online
 */
export const ErrorLog = co.feed(ErrorEntry);
export type ErrorLog = co.loaded<typeof ErrorLog>;
