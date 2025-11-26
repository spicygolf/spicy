import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  ListOfRounds,
  MapOfScores,
  Round,
  RoundToGame,
  type Round as RoundType,
} from "spicylib/schema";
import {
  calculateCourseHandicap,
  formatDate,
  formatTime,
  isSameDay,
} from "spicylib/utils";
import { Back } from "@/components/Back";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Screen, Text } from "@/ui";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "AddRoundToGame"
>;

export function AddRoundToGame({ route, navigation }: Props) {
  const { playerId } = route.params;
  const { game } = useGame(undefined, {
    resolve: {
      start: true,
      players: {
        $each: {
          name: true,
          handicap: true,
          rounds: {
            $each: {
              createdAt: true,
              playerId: true,
              handicapIndex: true,
              course: { name: true },
              tee: { name: true, ratings: { total: true } },
            },
          },
        },
      },
      rounds: true,
    },
  });
  const [isCreating, setIsCreating] = useState(false);

  // Get the player from the game context
  const player = useMemo(() => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return null;
    }

    return (
      game.players.find(
        (p: MaybeLoaded<(typeof game.players)[0]>) =>
          p?.$isLoaded && p.$jazz.id === playerId,
      ) || null
    );
  }, [game, playerId]);

  const gameDate = game?.$isLoaded ? game.start : new Date();

  const roundsForToday = useMemo(() => {
    if (!player?.$isLoaded || !player.rounds?.$isLoaded) return [];

    return player.rounds.filter((round) => {
      if (!round?.$isLoaded) return false;
      return isSameDay(round.createdAt, gameDate);
    });
  }, [player, gameDate]);

  if (!player) {
    return null;
  }

  function handleCreateNewRound() {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded || !game.players?.$isLoaded)
      return;

    setIsCreating(true);

    const group = game.rounds.$jazz.owner;
    const playerGroup = game.players.$jazz.owner;

    // Get the player from game.players to ensure we modify the right instance
    const gamePlayer = game.players.find(
      (p: MaybeLoaded<(typeof game.players)[0]>) =>
        p?.$isLoaded && p.$jazz.id === player?.$jazz.id,
    );

    if (!gamePlayer?.$isLoaded) {
      setIsCreating(false);
      return;
    }

    const newRound = Round.create(
      {
        createdAt: gameDate,
        playerId: gamePlayer.$jazz.id,
        handicapIndex: gamePlayer.handicap?.$isLoaded
          ? gamePlayer.handicap.display || "0.0"
          : "0.0",
        scores: MapOfScores.create({}, { owner: group }),
      },
      { owner: group },
    );

    // Initialize rounds list if it doesn't exist
    if (!gamePlayer.$jazz.has("rounds") || !gamePlayer.rounds?.$isLoaded) {
      const roundsList = ListOfRounds.create([newRound], {
        owner: playerGroup,
      });
      gamePlayer.$jazz.set("rounds", roundsList);
    } else {
      gamePlayer.rounds.$jazz.push(newRound);
    }

    addRoundToGame(newRound);
    setIsCreating(false);
  }

  function addRoundToGame(round: RoundType) {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded) return;

    const group = game.rounds.$jazz.owner;

    // Calculate course handicap if we have the necessary data
    let courseHandicap: number | undefined;
    if (
      round.$isLoaded &&
      round.tee?.$isLoaded &&
      round.tee.ratings?.$isLoaded &&
      round.tee.ratings.total?.$isLoaded &&
      round.handicapIndex
    ) {
      const calculated = calculateCourseHandicap({
        handicapIndex: round.handicapIndex,
        tee: round.tee,
        holesPlayed: "all18",
      });
      // calculateCourseHandicap returns number | null, but we only want number | undefined
      courseHandicap = calculated !== null ? calculated : undefined;
    }

    const roundToGame = RoundToGame.create(
      {
        round,
        handicapIndex: round.handicapIndex,
        ...(courseHandicap !== undefined &&
          courseHandicap !== null && { courseHandicap }),
      },
      { owner: group },
    );

    game.rounds.$jazz.push(roundToGame);
    navigation.goBack();
  }

  function handleSelectRound(round: RoundType) {
    addRoundToGame(round);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <View style={styles.title}>
          <Text style={styles.titleText}>
            Rounds: {player.$isLoaded ? player.name : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Game Date: {gameDate.toLocaleDateString()}
      </Text>

      {roundsForToday.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No rounds found for {gameDate.toLocaleDateString()}
          </Text>
          {!isCreating && (
            <Button label="Create New Round" onPress={handleCreateNewRound} />
          )}
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>
            Select a round ({roundsForToday.length})
          </Text>
          <FlatList
            data={roundsForToday}
            renderItem={({ item, index }) => {
              const roundTime =
                item?.$isLoaded && item.createdAt
                  ? formatTime(item.createdAt)
                  : "";
              const roundDate =
                item?.$isLoaded && item.createdAt
                  ? formatDate(item.createdAt)
                  : "";
              const isLastItem = index === roundsForToday.length - 1;

              return (
                <TouchableOpacity
                  style={[styles.roundItem, isLastItem && styles.lastRoundItem]}
                  onPress={() => item?.$isLoaded && handleSelectRound(item)}
                >
                  <View>
                    <Text style={styles.roundText}>
                      {roundDate} {roundTime}
                    </Text>
                    <Text style={styles.roundSubtext}>
                      {item?.$isLoaded && item.course?.$isLoaded
                        ? item.course.name
                        : "No Course"}{" "}
                      •{" "}
                      {item?.$isLoaded && item.tee?.$isLoaded
                        ? item.tee.name
                        : "No Tee"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item?.$jazz.id || ""}
            ListFooterComponent={
              !isCreating ? (
                <Button
                  label="Create New Round"
                  onPress={handleCreateNewRound}
                />
              ) : null
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(2),
  },
  title: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: theme.gap(2),
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.gap(4),
  },
  emptyText: {
    fontSize: 16,
    marginBottom: theme.gap(2),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.gap(2),
  },
  roundItem: {
    padding: theme.gap(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  lastRoundItem: {
    borderBottomWidth: 0,
  },
  roundText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  roundSubtext: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
