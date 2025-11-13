import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { acronym } from "spicylib/utils";
import { Handicap } from "@/components/handicap/Handicap";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersListItem({ player }: { player: Player | null }) {
  const navigation = useNavigation<NavigationProp>();

  if (!player) return null;
  const courseHandicap = undefined; // TODO: Implement course/game handicap calculation
  const gameHandicap = undefined; // TODO: Implement game handicap calculation (overrides course)

  const label = gameHandicap ? "game" : "course";
  const courseGameHandicap = gameHandicap ?? courseHandicap;

  // Determine the subtitle and navigation behavior
  const hasRounds = player.rounds && player.rounds.length > 0;
  const firstRound = hasRounds ? player.rounds[0] : null;

  // Check if course and tee exist and have accessible data
  const course = firstRound?.course;
  const tee = firstRound?.tee;
  // Try to access the name property - if it's accessible, they're loaded
  let hasSelectedCourseTee = false;
  try {
    hasSelectedCourseTee = !!(course?.name && tee?.name);
  } catch {
    // If accessing the property throws "value is unavailable", catch it
    hasSelectedCourseTee = false;
  }

  const needsCourseAndTee =
    hasRounds && player.rounds.some((round) => !round?.course || !round?.tee);

  let subtitle = "";
  let onPress: (() => void) | undefined;

  if (!hasRounds) {
    subtitle = "Select Round";
    onPress = () =>
      navigation.navigate("AddRoundToGame", { playerId: player.$jazz.id });
  } else if (hasSelectedCourseTee && course && tee) {
    // Show the selected course and tee names
    const courseName = acronym(course.name);
    const teeName = tee.name;
    subtitle = `${courseName} • ${teeName}`;
    // Allow changing the selection
    onPress = () =>
      navigation.navigate("SelectCourseTee", {
        playerId: player.$jazz.id,
        roundId: firstRound.$jazz.id,
      });
  } else if (needsCourseAndTee) {
    subtitle = "Select Course/Tee";
    // Find the first round that needs course/tee selection
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
