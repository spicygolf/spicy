/**
 * Check whether a key from Object.keys() on a Jazz CoMap is a user-data key.
 *
 * Jazz CoMaps expose internal keys (`$jazz`, `$isLoaded`, `_refs`, etc.)
 * alongside user data. This predicate filters them out so callers can
 * iterate only over application data.
 */
export function isCoMapDataKey(key: string): boolean {
  return !key.startsWith("$") && key !== "_refs";
}
