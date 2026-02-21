import type { MaybeLoaded } from "jazz-tools";
import { StyleSheet } from "react-native-unistyles";
import type { ListOfRoundToGames } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";
import { Text } from "@/ui";

interface GameCourseTeeDisplayProps {
  rounds: MaybeLoaded<ListOfRoundToGames> | null | undefined;
}

/**
 * Displays course/tee info from already-loaded rounds data.
 * Shows "SLUG • TeeName" if all rounds have the same course/tee.
 * Shows "Mixed Tees" if rounds have different courses/tees.
 * Data is pre-loaded by GameListItem's resolve query.
 */
export function GameCourseTeeDisplay({ rounds }: GameCourseTeeDisplayProps) {
  if (!rounds?.$isLoaded || rounds.length === 0) return null;

  const courseTeeStrings = new Set<string>();
  let hasIncomplete = false;

  for (const rtg of rounds) {
    if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) {
      hasIncomplete = true;
      continue;
    }

    const round = rtg.round;
    const course = round.course;
    const tee = round.tee;

    if (!course?.$isLoaded || !tee?.$isLoaded || !course.name || !tee.name) {
      hasIncomplete = true;
      continue;
    }

    const facilityName = course.facility?.$isLoaded
      ? course.facility.name
      : undefined;
    const slug = courseAcronym(course.name, facilityName);
    courseTeeStrings.add(`${slug} • ${tee.name}`);
  }

  // Still loading or incomplete
  if (hasIncomplete && courseTeeStrings.size === 0) return null;

  // Determine display text
  let displayText: string;
  if (hasIncomplete || courseTeeStrings.size !== 1) {
    displayText = courseTeeStrings.size > 0 ? "Mixed Tees" : "";
  } else {
    displayText = Array.from(courseTeeStrings)[0];
  }

  if (!displayText) return null;

  return <Text style={styles.text}>{displayText}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
    fontStyle: "italic",
  },
}));
