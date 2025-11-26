import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import type { ListOfRoundToGames } from "spicylib/schema";
import { ListOfRoundToGames as ListOfRoundToGamesSchema } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";

/**
 * Returns course and tee information in the format "SLUG • TeeName".
 * Returns "various" if players have different courses/tees or incomplete selections.
 * Returns null if still loading.
 *
 * PERFORMANCE: Only loads course and tee names from rounds, not full round data.
 *
 * @param roundsId - ListOfRoundToGames ID to check
 * @returns Course/tee string if same across all rounds, "various" if different, null if loading
 *
 * @example
 * const courseName = useGameCourseName(game?.rounds?.$jazz.id);
 * // Returns: "DHGC • Presidents" or "various" or null
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
                course: {
                  facility: true,
                },
                tee: true,
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

  // Track unique course/tee combinations
  const courseTeeStrings = new Set<string>();
  let hasIncompleteSelections = false;

  for (const rtg of rounds) {
    if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) {
      continue;
    }

    const round = rtg.round;
    const course = round.course;
    const tee = round.tee;

    // Check if this round has both course and tee selected
    if (!course?.$isLoaded || !tee?.$isLoaded || !course.name || !tee.name) {
      hasIncompleteSelections = true;
      continue;
    }

    // Build the display string: "SLUG • TeeName"
    const facilityName = course.facility?.$isLoaded
      ? course.facility.name
      : undefined;
    const slug = courseAcronym(course.name, facilityName);
    const courseTeeString = `${slug} • ${tee.name}`;
    courseTeeStrings.add(courseTeeString);
  }

  // If any player is missing course/tee selections, show "various"
  if (hasIncompleteSelections) {
    return "various";
  }

  // If all players have selections but they're different, show "various"
  if (courseTeeStrings.size !== 1) {
    return "various";
  }

  // All players have the same course/tee
  return Array.from(courseTeeStrings)[0];
}
