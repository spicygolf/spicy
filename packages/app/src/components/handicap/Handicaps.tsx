import type { MaybeLoaded } from "jazz-tools";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player, Round, RoundToGame } from "spicylib/schema";
import {
  calculateCourseHandicap,
  formatCourseHandicap,
  formatHandicapDisplay,
} from "spicylib/utils";
import { Handicap } from "./Handicap";

interface Props {
  player: Player | null;
  round?: MaybeLoaded<Round> | null;
  roundToGame?: MaybeLoaded<RoundToGame>;
  onPress?: () => void;
}

export function Handicaps({ player, round, roundToGame, onPress }: Props) {
  // Calculate course handicap directly - no useState or useEffect needed
  // Jazz is reactive, so this will recalculate when round or roundToGame changes
  const calculatedCourseHandicap = (() => {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return null;
    if (!round.$jazz.has("tee")) return null;

    const tee = round.tee;
    if (!tee?.$isLoaded) return null;
    if (!tee.ratings?.total) return null;

    const handicapIndex = roundToGame.handicapIndex || round.handicapIndex;
    if (!handicapIndex) return null;

    return calculateCourseHandicap({
      handicapIndex,
      tee,
      holesPlayed: "all18",
    });
  })();

  const hasIndexOverride = (() => {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return false;
    return (
      roundToGame.$isLoaded &&
      round.$isLoaded &&
      roundToGame.handicapIndex !== round.handicapIndex
    );
  })();

  const hasCourseGameOverride = (() => {
    if (!roundToGame?.$isLoaded) return false;

    // Check if there's a course handicap override
    // Field must exist (has) AND have a non-undefined value
    // Note: Use $jazz.delete() to remove fields, not $jazz.set(undefined)
    if (roundToGame.courseHandicap !== undefined) {
      return roundToGame.courseHandicap !== calculatedCourseHandicap;
    }

    // Check if there's a game handicap override that differs from calculated
    if (roundToGame.gameHandicap !== undefined) {
      return roundToGame.gameHandicap !== calculatedCourseHandicap;
    }

    return false;
  })();

  const handicapIndexDisplay = (() => {
    if (
      roundToGame?.$isLoaded &&
      roundToGame.$isLoaded &&
      roundToGame.handicapIndex
    ) {
      return roundToGame.handicapIndex;
    }
    if (player?.handicap?.$isLoaded && player.handicap.$isLoaded) {
      return formatHandicapDisplay(
        player.handicap.value,
        player.handicap.display,
      );
    }
    return undefined;
  })();

  if (!player?.$isLoaded) return null;

  const courseHandicap =
    roundToGame?.$isLoaded && roundToGame.courseHandicap !== undefined
      ? roundToGame.courseHandicap
      : calculatedCourseHandicap;

  const gameHandicap = roundToGame?.$isLoaded
    ? roundToGame.gameHandicap
    : undefined;

  const label = gameHandicap !== undefined ? "game" : "course";
  const courseGameHandicap = gameHandicap ?? courseHandicap;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress}>
      <Handicap
        label="index"
        display={handicapIndexDisplay}
        color={hasIndexOverride ? "#FFA500" : undefined}
      />
      <Handicap
        label={label}
        display={
          courseGameHandicap !== null && courseGameHandicap !== undefined
            ? formatCourseHandicap(courseGameHandicap)
            : undefined
        }
        color={hasCourseGameOverride ? "#FFA500" : undefined}
      />
    </Container>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
}));
