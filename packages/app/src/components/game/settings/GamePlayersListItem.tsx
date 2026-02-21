import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { Handicaps } from "@/components/handicap/Handicaps";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Text } from "@/ui";
import { usePerfMountTracker, usePerfRenderCount } from "@/utils/perfTrace";
import { PlayerCourseTeeInfo } from "./PlayerCourseTeeInfo";
import { PlayerDelete } from "./PlayerDelete";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

interface GamePlayersListItemProps {
  player: Player | null;
  /** Shots off the lowest handicap player (only in "low" mode) */
  shotsOff: number | null;
}

export function GamePlayersListItem({
  player,
  shotsOff,
}: GamePlayersListItemProps): React.ReactNode {
  usePerfRenderCount("GamePlayersListItem");
  usePerfMountTracker("GamePlayersListItem");

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
              ratings: true,
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

  // Find the round for this player in this game
  const roundToGame =
    game?.$isLoaded && game.rounds?.$isLoaded
      ? game.rounds.find(
          (rtg) =>
            rtg?.$isLoaded &&
            rtg.round?.$isLoaded &&
            rtg.round.playerId === player.$jazz.id,
        )
      : undefined;

  const gameRound = roundToGame?.$isLoaded ? roundToGame.round : null;
  const hasRounds = !!roundToGame;

  // Check if the round attached to THIS game has course/tee selected
  const hasSelectedCourseTee =
    gameRound?.$isLoaded &&
    gameRound.$jazz.has("course") &&
    gameRound.$jazz.has("tee");

  const needsCourseAndTee =
    hasRounds &&
    gameRound?.$isLoaded &&
    (!gameRound.$jazz.has("course") || !gameRound.$jazz.has("tee"));

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

  // Generate testID for player row actions (for E2E testing)
  // Use player name (lowercased, spaces removed) for predictable testID
  const playerNameSlug = player.name.toLowerCase().replace(/\s+/g, "-");
  let playerRowTestId: string | undefined;
  if (!hasRounds) {
    playerRowTestId = `select-round-${playerNameSlug}`;
  } else if (needsCourseAndTee) {
    playerRowTestId = `select-course-tee-${playerNameSlug}`;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.player}
        onPress={onPress}
        disabled={!onPress}
        testID={playerRowTestId}
      >
        <Text style={styles.player_name}>{player.name}</Text>
        {subtitle && (
          <Text
            style={
              needsCourseAndTee || !hasRounds
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
          round={gameRound}
          roundToGame={roundToGame}
          shotsOff={shotsOff}
          onPress={
            roundToGame?.$isLoaded
              ? () =>
                  navigation.navigate("HandicapAdjustment", {
                    playerId: player.$jazz.id,
                    roundToGameId: roundToGame.$jazz.id,
                  })
              : undefined
          }
          testID={`handicap-adjustment-${playerNameSlug}`}
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
