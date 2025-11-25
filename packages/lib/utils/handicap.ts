import type { Tee } from "../schema/courses";

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

  return Math.round(index * (slope / 113));
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

function getRatings(
  tee: Tee,
  holesPlayed: "front9" | "back9" | "all18",
): { rating: number | null; slope: number | null; bogey: number | null } {
  if (!tee?.ratings?.$isLoaded) {
    return { rating: null, slope: null, bogey: null };
  }

  let ratings: { rating: number; slope: number; bogey: number } | null = null;

  switch (holesPlayed) {
    case "front9":
      ratings = tee.ratings.front?.$isLoaded ? tee.ratings.front : null;
      break;
    case "back9":
      ratings = tee.ratings.back?.$isLoaded ? tee.ratings.back : null;
      break;
    case "all18":
      ratings = tee.ratings.total?.$isLoaded ? tee.ratings.total : null;
      break;
  }

  if (!ratings) {
    return { rating: null, slope: null, bogey: null };
  }

  return {
    rating: Math.round((ratings.rating + Number.EPSILON) * 10) / 10,
    slope: ratings.slope,
    bogey: ratings.bogey,
  };
}
