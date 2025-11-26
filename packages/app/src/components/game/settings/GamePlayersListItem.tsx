import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player, Round } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";
import { Handicaps } from "@/components/handicap/Handicaps";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

const PlayerCourseTeeInfo = memo(({ round }: { round: Round | null }) => {
  if (!round?.$isLoaded) return null;

  try {
    if (round.$jazz.has("course") && round.$jazz.has("tee")) {
      const course = round.course;
      const tee = round.tee;

      if (course?.$isLoaded && tee?.$isLoaded && course.name && tee.name) {
        const facilityName = course.facility?.$isLoaded
          ? course.facility.name
          : undefined;
        return (
          <Text style={styles.player_tees}>
            {courseAcronym(course.name, facilityName)} • {tee.name}
          </Text>
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
  const { game } = useGame(undefined, {
    resolve: {
      rounds: {
        $each: {
          round: {
            playerId: true,
            course: {
              name: true,
              facility: { name: true },
            },
            tee: {
              name: true,
            },
          },
          handicapIndex: true,
          courseHandicap: true,
          gameHandicap: true,
        },
      },
    },
  });

  if (!player?.$isLoaded) return null;

  const hasRounds = player.rounds?.$isLoaded && player.rounds.length > 0;
  const firstRound = hasRounds ? player.rounds[0] : null;

  const roundToGame =
    game?.$isLoaded && game.rounds?.$isLoaded && firstRound?.$isLoaded
      ? game.rounds.find(
          (rtg) =>
            rtg?.$isLoaded &&
            rtg.round?.$isLoaded &&
            rtg.round.$jazz.id === firstRound.$jazz.id,
        )
      : undefined;

  // Check if the round attached to THIS game has course/tee selected
  const gameRound = roundToGame?.$isLoaded ? roundToGame.round : null;
  const hasSelectedCourseTee =
    gameRound?.$isLoaded &&
    gameRound.$jazz.has("course") &&
    gameRound.$jazz.has("tee");

  const needsCourseAndTee =
    hasRounds && gameRound?.$isLoaded && (!gameRound.course || !gameRound.tee);

  let subtitle = "";
  let onPress: (() => void) | undefined;

  if (!hasRounds) {
    subtitle = "Select Round";
    onPress = () =>
      navigation.navigate("AddRoundToGame", { playerId: player.$jazz.id });
  } else if (needsCourseAndTee && gameRound?.$isLoaded) {
    subtitle = "Select Course/Tee";
    onPress = () =>
      navigation.navigate("SelectCourseNavigator", {
        playerId: player.$jazz.id,
        roundId: gameRound.$jazz.id,
      });
  } else if (hasSelectedCourseTee && gameRound?.$isLoaded) {
    onPress = () =>
      navigation.navigate("SelectCourseNavigator", {
        playerId: player.$jazz.id,
        roundId: gameRound.$jazz.id,
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
        {subtitle && (
          <Text
            style={
              needsCourseAndTee
                ? styles.player_tees_highlight
                : styles.player_tees
            }
          >
            {subtitle}
          </Text>
        )}
        {hasSelectedCourseTee && !subtitle && (
          <PlayerCourseTeeInfo round={gameRound} />
        )}
      </TouchableOpacity>
      <View style={styles.handicaps}>
        <Handicaps
          player={player}
          round={roundToGame?.$isLoaded ? roundToGame.round : firstRound}
          roundToGame={roundToGame}
          onPress={
            roundToGame?.$isLoaded
              ? () =>
                  navigation.navigate("HandicapAdjustment", {
                    playerId: player.$jazz.id,
                    roundToGameId: roundToGame.$jazz.id,
                  })
              : undefined
          }
        />
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
  player_tees_highlight: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.action,
    fontWeight: "600",
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
