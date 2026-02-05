import type { Tee } from "../schema/courses";

/**
 * USGA standard slope rating used as the baseline for handicap calculations.
 * All course slopes are compared against this value.
 * @see https://www.usga.org/handicapping/roh/Content/rules/5%202%20Calculation%20of%20a%20Course%20Handicap.htm
 */
export const STANDARD_SLOPE_RATING = 113;

interface CourseHandicapParams {
  handicapIndex: string;
  tee: Tee;
  holesPlayed?: "front9" | "back9" | "all18";
}

export interface PlayerHandicap {
  playerId: string;
  courseHandicap: number;
  gameHandicap?: number;
}

/**
 * Adjust handicaps relative to the lowest handicap player
 * Used in "low" handicap mode where strokes are based on differences
 *
 * @param playerHandicaps - Array of player handicaps
 * @returns Map of playerId to adjusted handicap (relative to lowest)
 *
 * @example
 * Input: [{playerId: "p1", courseHandicap: 3}, {playerId: "p2", courseHandicap: -4}]
 * Output: Map { "p1" => 7, "p2" => 0 }
 */
export function adjustHandicapsToLow(
  playerHandicaps: PlayerHandicap[],
): Map<string, number> {
  if (playerHandicaps.length === 0) {
    return new Map();
  }

  // Find the lowest handicap (could be negative for plus handicaps)
  const lowestHandicap = Math.min(
    ...playerHandicaps.map((p) => p.gameHandicap ?? p.courseHandicap),
  );

  // Calculate adjusted handicaps relative to the lowest
  const adjustedMap = new Map<string, number>();
  for (const player of playerHandicaps) {
    const effectiveHandicap = player.gameHandicap ?? player.courseHandicap;
    const adjusted = effectiveHandicap - lowestHandicap;
    adjustedMap.set(player.playerId, adjusted);
  }

  return adjustedMap;
}

/**
 * Get the effective handicap for a player
 * Priority: gameHandicap > courseHandicap
 */
export function getEffectiveHandicap(
  courseHandicap: number,
  gameHandicap?: number,
): number {
  return gameHandicap ?? courseHandicap;
}

/**
 * Calculate course handicap from numeric handicap index and slope.
 * This is the core calculation used by both app code and test fixtures.
 *
 * Formula: Course Handicap = round(Handicap Index × Slope Rating / 113)
 *
 * @param handicapIndex - Numeric handicap index (negative for plus handicaps)
 * @param slope - Course slope rating
 * @returns Course handicap rounded to nearest integer
 *
 * @example
 * courseHandicapFromSlope(10.5, 139) // returns 13
 * courseHandicapFromSlope(-2.0, 139) // returns -2 (plus handicap)
 */
export function courseHandicapFromSlope(
  handicapIndex: number,
  slope: number,
): number {
  return Math.round((handicapIndex * slope) / STANDARD_SLOPE_RATING);
}

/**
 * Calculate course handicap from a Tee object (for app use with Jazz CoMaps).
 * Handles string parsing and Tee rating lookups.
 *
 * @param params - Object containing handicapIndex string, Tee, and optional holesPlayed
 * @returns Course handicap or null if inputs are invalid
 */
export function calculateCourseHandicap({
  handicapIndex,
  tee,
  holesPlayed = "all18",
}: CourseHandicapParams): number | null {
  if (!tee?.$isLoaded) {
    return null;
  }

  let index = Number.parseFloat(handicapIndex);
  if (Number.isNaN(index)) {
    return null;
  }

  if (handicapIndex.charAt(0) === "+") {
    index *= -1;
  }

  const { slope } = getRatings(tee, holesPlayed);
  if (slope === null) {
    return null;
  }

  return courseHandicapFromSlope(index, slope);
}

export function formatCourseHandicap(courseHandicap: number | null): string {
  if (courseHandicap === null || courseHandicap === undefined) {
    return "";
  }

  let formatted = courseHandicap.toString();
  if (formatted.startsWith("-")) {
    formatted = formatted.replace("-", "+");
  }

  return formatted;
}

export function formatHandicapIndex(handicapIndex: string | null): string {
  if (!handicapIndex) {
    return "";
  }
  return handicapIndex;
}

/**
 * Format a handicap value for display.
 * Uses the display string if provided, otherwise generates from numeric value.
 * Plus handicaps (negative values) are formatted with a + prefix.
 *
 * @param value - Numeric handicap value (negative for plus handicaps)
 * @param display - Optional pre-formatted display string
 * @returns Formatted display string, or undefined if no value
 */
export function formatHandicapDisplay(
  value: number | null | undefined,
  display?: string,
): string | undefined {
  if (display) return display;
  if (value == null) return undefined;
  return value < 0 ? `+${Math.abs(value)}` : value.toString();
}

type HolesPlayed = "front9" | "back9" | "all18";

function getRatings(
  tee: Tee,
  holesPlayed: HolesPlayed,
): { rating: number | null; slope: number | null; bogey: number | null } {
  if (!tee?.ratings) {
    return { rating: null, slope: null, bogey: null };
  }

  const ratings =
    holesPlayed === "front9"
      ? tee.ratings.front
      : holesPlayed === "back9"
        ? tee.ratings.back
        : tee.ratings.total;

  if (!ratings) {
    return { rating: null, slope: null, bogey: null };
  }

  // Check if the rating object has the required properties (not just $isLoaded: false)
  if (
    typeof ratings.rating !== "number" ||
    typeof ratings.slope !== "number" ||
    typeof ratings.bogey !== "number"
  ) {
    return { rating: null, slope: null, bogey: null };
  }

  return {
    rating: Math.round((ratings.rating + Number.EPSILON) * 10) / 10,
    slope: ratings.slope,
    bogey: ratings.bogey,
  };
}
