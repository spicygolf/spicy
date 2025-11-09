import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  ListOfRounds,
  ListOfScores,
  Round,
  RoundToGame,
  type Round as RoundType,
} from "spicylib/schema";
import { formatDate, formatTime, isSameDay } from "spicylib/utils";
import { Back } from "@/components/Back";
import { useGameContext } from "@/contexts/GameContext";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Button, Screen, Text } from "@/ui";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "AddRoundToGame"
>;

export function AddRoundToGame({ route, navigation }: Props) {
  const { playerId } = route.params;
  const { game } = useGameContext();
  const [isCreating, setIsCreating] = useState(false);

  // Get the player from the game context
  const player = useMemo(() => {
    if (!game?.players) {
      return null;
    }

    return game.players.find((p) => p?.$jazz.id === playerId) || null;
  }, [game?.players, playerId]);

  const gameDate = game?.start || new Date();

  const roundsForToday = useMemo(() => {
    if (!player?.rounds) return [];

    return player.rounds.filter((round) => {
      if (!round) return false;
      return isSameDay(round.createdAt, gameDate);
    });
  }, [player?.rounds, gameDate]);

  if (!player) {
    return null;
  }

  function handleCreateNewRound() {
    if (!game?.rounds || !game?.players) return;

    setIsCreating(true);

    const group = game.rounds.$jazz.owner;
    const playerGroup = game.players.$jazz.owner;

    // Get the player from game.players to ensure we modify the right instance
    const gamePlayer = game.players.find(
      (p) => p?.$jazz.id === player?.$jazz.id,
    );

    if (!gamePlayer) {
      setIsCreating(false);
      return;
    }

    const newRound = Round.create(
      {
        createdAt: gameDate,
        playerId: gamePlayer.$jazz.id,
        handicapIndex: gamePlayer.handicap?.display || "0.0",
        scores: ListOfScores.create([], { owner: group }),
      },
      { owner: group },
    );

    // Initialize rounds list if it doesn't exist
    if (!gamePlayer.rounds) {
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
    if (!game?.rounds) return;

    const group = game.rounds.$jazz.owner;

    const roundToGame = RoundToGame.create(
      {
        round,
        handicapIndex: round.handicapIndex,
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
          <Text style={styles.titleText}>Rounds: {player.name}</Text>
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
              const roundTime = item?.createdAt
                ? formatTime(item.createdAt)
                : "";
              const roundDate = item?.createdAt
                ? formatDate(item.createdAt)
                : "";
              const isLastItem = index === roundsForToday.length - 1;

              return (
                <TouchableOpacity
                  style={[styles.roundItem, isLastItem && styles.lastRoundItem]}
                  onPress={() => item && handleSelectRound(item)}
                >
                  <View>
                    <Text style={styles.roundText}>
                      {roundDate} {roundTime}
                    </Text>
                    <Text style={styles.roundSubtext}>
                      {item?.course?.name || "No Course"} •{" "}
                      {item?.tee?.name || "No Tee"}
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
