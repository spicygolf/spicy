import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { RoundToGame, type Round as RoundType } from "spicylib/schema";
import {
  calculateCourseHandicap,
  formatDate,
  formatTime,
} from "spicylib/utils";
import { Back } from "@/components/Back";
import { RoundCourseTeeName } from "@/components/game/settings/RoundCourseTeeName";
import { useGame } from "@/hooks";
import { useRoundsForDate } from "@/hooks/useRoundsForDate";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Screen, Text } from "@/ui";
import { createRoundForPlayer } from "@/utils/createRoundForPlayer";
import { reportError } from "@/utils/reportError";

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
        },
      },
      rounds: true,
    },
  });
  const [isCreating, setIsCreating] = useState(false);

  // Get the player from the game context - direct access (Jazz is reactive)
  const player = (() => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return null;
    }

    return (
      game.players.find(
        (p: MaybeLoaded<(typeof game.players)[0]>) =>
          p?.$isLoaded && p.$jazz.id === playerId,
      ) || null
    );
  })();

  const gameDate = game?.$isLoaded ? game.start : new Date();
  const gameId = game?.$isLoaded ? game.$jazz.id : undefined;

  const { rounds: roundsForToday, loaded: roundsLoaded } = useRoundsForDate(
    playerId,
    gameDate,
    gameId,
  );

  if (!player) {
    return null;
  }

  async function handleCreateNewRound(): Promise<void> {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded || !game.players?.$isLoaded)
      return;

    setIsCreating(true);

    // Get the player from game.players to ensure we modify the right instance
    const gamePlayer = game.players.find(
      (p: MaybeLoaded<(typeof game.players)[0]>) =>
        p?.$isLoaded && p.$jazz.id === player?.$jazz.id,
    );

    if (!gamePlayer?.$isLoaded) {
      setIsCreating(false);
      return;
    }

    await createRoundForPlayer(game, gamePlayer);
    setIsCreating(false);
    navigation.goBack();
  }

  async function addRoundToGame(round: RoundType): Promise<void> {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded) return;

    const group = game.rounds.$jazz.owner;

    // Calculate course handicap if we have the necessary data
    let courseHandicap: number | undefined;
    if (round.$isLoaded && round.$jazz.has("tee") && round.handicapIndex) {
      // Load the tee data to calculate handicap
      const loadedRound = await round.$jazz.ensureLoaded({
        resolve: {
          tee: true,
        },
      });

      if (loadedRound.tee?.$isLoaded && loadedRound.tee.ratings?.total) {
        const calculated = calculateCourseHandicap({
          handicapIndex: loadedRound.handicapIndex,
          tee: loadedRound.tee,
          holesPlayed: "all18",
        });
        courseHandicap = calculated !== null ? calculated : undefined;
      }
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

  function handleSelectRound(round: RoundType): void {
    addRoundToGame(round).catch((e) =>
      reportError(e instanceof Error ? e : new Error(String(e)), {
        source: "AddRoundToGame.handleSelectRound",
      }),
    );
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

      {!roundsLoaded ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading rounds...</Text>
        </View>
      ) : roundsForToday.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No rounds found for {gameDate.toLocaleDateString()}
          </Text>
          {!isCreating && (
            <Button
              testID="create-new-round-button"
              label="Create New Round"
              onPress={handleCreateNewRound}
            />
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
                item?.$isLoaded && item.start ? formatTime(item.start) : "";
              const roundDate =
                item?.$isLoaded && item.start ? formatDate(item.start) : "";
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
                    <RoundCourseTeeName round={item} />
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item?.$jazz.id || ""}
            ListFooterComponent={
              !isCreating ? (
                <Button
                  testID="create-new-round-button"
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
