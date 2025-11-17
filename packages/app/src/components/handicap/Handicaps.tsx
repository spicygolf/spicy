import type { MaybeLoaded } from "jazz-tools";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player, Round, RoundToGame } from "spicylib/schema";
import { calculateCourseHandicap, formatCourseHandicap } from "spicylib/utils";
import { Handicap } from "./Handicap";

interface Props {
  player: Player | null;
  round?: MaybeLoaded<Round> | null;
  roundToGame?: MaybeLoaded<RoundToGame>;
  onPress?: () => void;
}

export function Handicaps({ player, round, roundToGame, onPress }: Props) {
  const calculatedCourseHandicap = useMemo(() => {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return null;
    if (!round.tee?.$isLoaded || !round.tee.ratings?.$isLoaded) return null;
    if (!round.tee.ratings.total?.$isLoaded) return null;

    const handicapIndex = roundToGame.handicapIndex || round.handicapIndex;
    if (!handicapIndex) return null;

    return calculateCourseHandicap({
      handicapIndex,
      tee: round.tee,
      holesPlayed: "all18",
    });
  }, [roundToGame, round]);

  const hasIndexOverride = useMemo(() => {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return false;
    return (
      roundToGame.$isLoaded &&
      round.$isLoaded &&
      roundToGame.handicapIndex !== round.handicapIndex
    );
  }, [roundToGame, round]);

  const hasCourseGameOverride = useMemo(() => {
    if (!roundToGame?.$isLoaded) return false;
    if (!roundToGame.$isLoaded) return false;

    // Check if there's a course handicap override
    if (roundToGame.courseHandicap !== undefined) {
      return roundToGame.courseHandicap !== calculatedCourseHandicap;
    }

    // Check if there's a game handicap override that differs from calculated
    if (roundToGame.gameHandicap !== undefined) {
      return roundToGame.gameHandicap !== calculatedCourseHandicap;
    }

    return false;
  }, [roundToGame, calculatedCourseHandicap]);

  const handicapIndexDisplay = useMemo(() => {
    if (
      roundToGame?.$isLoaded &&
      roundToGame.$isLoaded &&
      roundToGame.handicapIndex
    ) {
      return roundToGame.handicapIndex;
    }
    return player?.handicap?.$isLoaded && player.handicap.$isLoaded
      ? player.handicap.display
      : undefined;
  }, [roundToGame, player]);

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
