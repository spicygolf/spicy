import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native-unistyles";
import type { ListOfRoundToGames } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";
import { Text } from "@/ui";

interface GameCourseTeeDisplayProps {
  rounds: MaybeLoaded<ListOfRoundToGames> | null | undefined;
}

/**
 * Loads course/tee data asynchronously for all rounds in a game.
 * Shows "SLUG • TeeName" if all rounds have the same course/tee.
 * Shows "various" if rounds have different courses/tees or incomplete selections.
 * Shows "Loading..." while data is being loaded.
 */
export function GameCourseTeeDisplay({ rounds }: GameCourseTeeDisplayProps) {
  const [displayText, setDisplayText] = useState<string>("Loading...");

  useEffect(() => {
    if (!rounds?.$isLoaded) {
      setDisplayText("Loading...");
      return;
    }

    const loadCourseTeeData = async () => {
      const courseTeeStrings = new Set<string>();
      let hasIncompleteSelections = false;

      // Load all rounds in parallel for better performance
      const results = await Promise.all(
        rounds.map(async (rtg) => {
          if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) {
            return null;
          }

          const round = rtg.round;

          // Check if course and tee fields exist
          const hasCourse = round.$jazz.has("course");
          const hasTee = round.$jazz.has("tee");

          if (!hasCourse || !hasTee) {
            return { incomplete: true };
          }

          // Load course and tee data asynchronously
          try {
            const loadedRound = await round.$jazz.ensureLoaded({
              resolve: {
                course: {
                  facility: true,
                },
                tee: true,
              },
            });

            const course = loadedRound.course;
            const tee = loadedRound.tee;

            if (
              !course?.$isLoaded ||
              !tee?.$isLoaded ||
              !course.name ||
              !tee.name
            ) {
              return { incomplete: true };
            }

            // Build the display string: "SLUG • TeeName"
            const facilityName = course.facility?.$isLoaded
              ? course.facility.name
              : undefined;
            const slug = courseAcronym(course.name, facilityName);
            const courseTeeString = `${slug} • ${tee.name}`;
            return { courseTeeString };
          } catch (error) {
            // Error loading course/tee data
            if (__DEV__) {
              console.warn("Failed to load course/tee data:", error);
            }
            return { incomplete: true };
          }
        }),
      );

      // Process results
      for (const result of results) {
        if (result === null) {
          continue;
        }
        if (result.incomplete) {
          hasIncompleteSelections = true;
        } else if (result.courseTeeString) {
          courseTeeStrings.add(result.courseTeeString);
        }
      }

      // Determine display text
      if (hasIncompleteSelections) {
        setDisplayText("various");
      } else if (courseTeeStrings.size !== 1) {
        setDisplayText("various");
      } else if (courseTeeStrings.size === 1) {
        setDisplayText(Array.from(courseTeeStrings)[0]);
      } else {
        // No rounds at all
        setDisplayText("");
      }
    };

    loadCourseTeeData();
  }, [rounds]);

  if (!displayText) return null;

  return <Text style={styles.text}>{displayText}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
    fontStyle: "italic",
  },
}));
