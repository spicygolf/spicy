/**
 * Error Messages Schema
 *
 * Defines the schema for error messages that can be dynamically updated
 * via the Jazz worker account catalog without requiring app rebuilds.
 *
 * Messages are organized by locale (e.g., "en_US", "en_GB", "es_ES")
 * and keyed by message identifier (e.g., "error_boundary_title").
 */

import { co, z } from "jazz-tools";

/**
 * ErrorMessage - A single error message with a key and localized text
 *
 * Multiple messages can share the same key to provide variety
 * (e.g., multiple "error_boundary_title" messages for random selection)
 */
export const ErrorMessage = co.map({
  key: z.string(), // Message identifier, e.g., "error_boundary_title"
  message: z.string(), // The actual message text
});
export type ErrorMessage = co.loaded<typeof ErrorMessage>;

/**
 * ListOfErrorMessages - Collection of error messages for a locale
 */
export const ListOfErrorMessages = co.list(ErrorMessage);
export type ListOfErrorMessages = co.loaded<typeof ListOfErrorMessages>;

/**
 * ErrorMessagesByLocale - Map of locale code to message list
 *
 * Keys are locale codes like "en_US", "en_GB", "es_ES", "es_MX"
 * Values are lists of ErrorMessage objects
 */
export const ErrorMessagesByLocale = co.record(z.string(), ListOfErrorMessages);
export type ErrorMessagesByLocale = co.loaded<typeof ErrorMessagesByLocale>;
