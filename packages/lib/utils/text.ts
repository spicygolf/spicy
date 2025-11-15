/**
 * Creates an acronym from a string by taking the first letter of each word.
 * If the string is shorter than 10 characters, returns the original string.
 *
 * @param orig - The original string to create an acronym from
 * @returns The acronym or original string if short enough
 *
 * @example
 * acronym("Pebble Beach Golf Links") // returns "PBGL"
 * acronym("Augusta") // returns "Augusta" (less than 10 chars)
 */
export function acronym(orig: string | null | undefined): string {
  if (!orig) {
    return "";
  }
  if (orig.length < 10) {
    return orig;
  }
  const matches = orig.match(/\b(\w)/g);
  const acr = matches?.join("") || "";
  return acr;
}

/**
 * Returns the first name from a full name string.
 *
 * @param name - The full name string
 * @returns The first name
 */
export function first(name: string): string {
  const names = name.split(" ");
  return names[0] || "";
}

/**
 * Returns the last name from a full name string.
 * TODO: handle name suffixes such as III, Jr. Sr. etc.
 *
 * @param name - The full name string
 * @returns The last name
 */
export function last(name: string): string {
  const names = name.split(" ");
  return names[names.length - 1] || "";
}

/**
 * Converts GHIN API gender format to schema format.
 * GHIN uses "Male"/"Female"/"Mixed", our schema uses "M"/"F".
 *
 * @param ghinGender - Gender string from GHIN API ("Male", "Female", or "Mixed")
 * @returns Schema gender format ("M" or "F"), defaults to "M" for "Mixed", null, or undefined
 *
 * @example
 * normalizeGender("Male") // returns "M"
 * normalizeGender("Female") // returns "F"
 * normalizeGender("Mixed") // returns "M"
 * normalizeGender(null) // returns "M"
 */
export function normalizeGender(
  ghinGender: string | null | undefined,
): "M" | "F" {
  if (ghinGender === "Female") return "F";
  return "M"; // Default to "M" for "Male", "Mixed", null, or undefined
}

/**
 * Extracts the state code from a GHIN API state string.
 * GHIN state format is "COUNTRY-STATE" (e.g., "US-TN", "US-GA").
 * Returns just the state code portion.
 *
 * @param state - State string from GHIN API (e.g., "US-TN")
 * @returns State code (e.g., "TN"), or original value if no hyphen found
 *
 * @example
 * stateCode("US-TN") // returns "TN"
 * stateCode("US-GA") // returns "GA"
 * stateCode("TN") // returns "TN" (no hyphen)
 * stateCode(null) // returns null
 */
export function stateCode(
  state: string | null | undefined,
): string | null | undefined {
  if (!state) return state;
  const parts = state.split("-");
  return parts.length > 1 ? parts[1] : state;
}
