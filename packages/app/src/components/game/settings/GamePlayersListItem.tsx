import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player, Round } from "spicylib/schema";
import { acronym } from "spicylib/utils";
import { Handicap } from "@/components/handicap/Handicap";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

const PlayerCourseTeeInfo = memo(({ round }: { round: Round | null }) => {
  if (!round) return null;

  try {
    if (round.$jazz.has("course") && round.$jazz.has("tee")) {
      const course = round.course;
      const tee = round.tee;

      if (course?.name && tee?.name) {
        return (
          <Text
            style={styles.player_tees}
          >{`${acronym(course.name)} • ${tee.name}`}</Text>
        );
      }
    }
  } catch {
    // Course/tee not loaded yet
  }

  return null;
});

export function GamePlayersListItem({ player }: { player: Player | null }) {
  const navigation = useNavigation<NavigationProp>();

  if (!player) return null;
  const courseHandicap = undefined; // TODO: Implement course/game handicap calculation
  const gameHandicap = undefined; // TODO: Implement game handicap calculation (overrides course)

  const label = gameHandicap ? "game" : "course";
  const courseGameHandicap = gameHandicap ?? courseHandicap;

  const hasRounds = player.rounds && player.rounds.length > 0;
  const firstRound = hasRounds ? player.rounds[0] : null;

  const hasSelectedCourseTee =
    firstRound?.$jazz.has("course") && firstRound?.$jazz.has("tee");

  const needsCourseAndTee =
    hasRounds && player.rounds.some((round) => !round?.course || !round?.tee);

  let subtitle = "";
  let onPress: (() => void) | undefined;

  if (!hasRounds) {
    subtitle = "Select Round";
    onPress = () =>
      navigation.navigate("AddRoundToGame", { playerId: player.$jazz.id });
  } else if (needsCourseAndTee) {
    subtitle = "Select Course/Tee";
    const roundNeedingSelection = player.rounds.find(
      (round) => !round?.course || !round?.tee,
    );
    if (roundNeedingSelection) {
      onPress = () =>
        navigation.navigate("SelectCourseTee", {
          playerId: player.$jazz.id,
          roundId: roundNeedingSelection.$jazz.id,
        });
    }
  } else if (hasSelectedCourseTee && firstRound) {
    onPress = () =>
      navigation.navigate("SelectCourseTee", {
        playerId: player.$jazz.id,
        roundId: firstRound.$jazz.id,
      });
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.player}
        onPress={onPress}
        disabled={!onPress}
      >
        <Text style={styles.player_name}>{player.name}</Text>
        {subtitle && <Text style={styles.player_tees}>{subtitle}</Text>}
        {hasSelectedCourseTee && !subtitle && (
          <PlayerCourseTeeInfo round={firstRound} />
        )}
      </TouchableOpacity>
      <View style={styles.handicaps}>
        <Handicap label="index" display={player?.handicap?.display} />
        <Handicap label={label} display={courseGameHandicap} />
      </View>
      <View style={styles.delete}>
        <PlayerDelete player={player} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1),
  },
  player: {
    flex: 5,
    flexDirection: "column",
  },
  player_name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  player_tees: {
    flex: 1,
    fontSize: 14,
  },
  handicaps: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  delete: {
    marginLeft: theme.gap(2),
  },
}));
