import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import type { ListOfRoundToGames } from "spicylib/schema";
import { ListOfRoundToGames as ListOfRoundToGamesSchema } from "spicylib/schema";

/**
 * Returns the course name if all rounds in the game are on the same course.
 * Returns null if rounds are on different courses or still loading.
 *
 * PERFORMANCE: Only loads course names from rounds, not full round data.
 *
 * @param roundsId - ListOfRoundToGames ID to check
 * @returns Course name if same across all rounds, null otherwise
 *
 * @example
 * const courseName = useGameCourseName(game?.rounds?.$jazz.id);
 * // Returns: "Pebble Beach Golf Links" or null
 */
export function useGameCourseName(roundsId: string | undefined): string | null {
  const startTime = useRef(Date.now());
  const loggedLoad = useRef(false);

  const rounds = useCoState(
    ListOfRoundToGamesSchema,
    roundsId || "",
    roundsId
      ? {
          resolve: {
            $each: {
              round: {
                course: true,
              },
            },
          },
          select: (value) => {
            if (!value.$isLoaded) {
              return value.$jazz.loadingState === "loading" ? undefined : null;
            }
            return value;
          },
        }
      : undefined,
  ) as ListOfRoundToGames | null;

  // Performance tracking
  useEffect(() => {
    if (rounds?.$isLoaded && !loggedLoad.current) {
      loggedLoad.current = true;
      const elapsed = Date.now() - startTime.current;
      console.log("[PERF] useGameCourseName LOADED", {
        elapsed,
        roundsCount: rounds.length,
      });
    }
  }, [rounds]);

  if (!rounds?.$isLoaded) return null;

  const courses = new Set<string>();
  for (const rtg of rounds) {
    if (rtg?.$isLoaded && rtg.round?.$isLoaded && rtg.round.course?.$isLoaded) {
      courses.add(rtg.round.course.name);
    }
  }

  return courses.size === 1 ? Array.from(courses)[0] : null;
}
