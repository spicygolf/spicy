/**
 * Deep clone utility
 *
 * A cross-platform alternative to structuredClone that works in React Native.
 * Uses JSON parse/stringify which is sufficient for plain data objects.
 */

/**
 * Deep clone an object using JSON serialization
 *
 * Note: This only works for JSON-serializable data (no functions, undefined, etc.)
 * For the scoring engine's data structures, this is sufficient.
 *
 * @param obj - Object to clone
 * @returns Deep cloned copy
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
