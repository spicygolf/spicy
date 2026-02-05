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
 * Creates a display string for a golf course, handling facility vs course names.
 * If facility exists and differs from course name, shows "FACILITY_ACRONYM - Course Name".
 * Otherwise, shows the course acronym.
 *
 * @param courseName - The course name
 * @param facilityName - Optional facility name
 * @returns Display string for the course
 *
 * @example
 * courseAcronym("Blue Course", "Congressional CC") // returns "CCC - Blue Course"
 * courseAcronym("Druid Hills Golf Club", "Druid Hills Golf Club") // returns "DHGC"
 * courseAcronym("Pebble Beach Golf Links") // returns "PBGL"
 */
export function courseAcronym(
  courseName: string | null | undefined,
  facilityName?: string | null | undefined,
): string {
  if (!courseName) {
    return "";
  }

  // If facility exists and is different from course name
  if (facilityName && facilityName !== courseName) {
    return `${acronym(facilityName)} - ${courseName}`;
  }

  // Otherwise just use the course acronym
  return acronym(courseName);
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
 * Handles common name suffixes (Jr, Sr, Jr., Sr., II, III, IV, etc.)
 *
 * @param name - The full name string
 * @returns The last name, excluding suffixes
 */
export function last(name: string): string {
  const names = name.split(" ");
  if (names.length === 0) return "";
  if (names.length === 1) return names[0] || "";

  const suffixes = [
    "Jr",
    "Jr.",
    "Sr",
    "Sr.",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ];
  const lastPart = names[names.length - 1] || "";

  if (suffixes.includes(lastPart)) {
    return names[names.length - 2] || lastPart;
  }

  return lastPart;
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

/**
 * Creates a URL-safe slug from a string.
 * Converts to lowercase and replaces whitespace with hyphens.
 * Useful for creating testIDs from player names.
 *
 * @param text - The string to slugify
 * @returns A URL-safe slug
 *
 * @example
 * slugify("Brad Smith") // returns "brad-smith"
 * slugify("Tim") // returns "tim"
 * slugify("Mary Jane Watson") // returns "mary-jane-watson"
 */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-");
}
