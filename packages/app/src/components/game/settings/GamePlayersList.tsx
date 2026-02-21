import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player, RoundToGame } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import {
  adjustHandicapsToLow,
  calculateCourseHandicap,
  type PlayerHandicap,
} from "spicylib/utils";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useAddPlayerToGame, useGame } from "@/hooks";
import { useOptionValue } from "@/hooks/useOptionValue";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button } from "@/ui";
import { usePerfMountTracker, usePerfRenderCount } from "@/utils/perfTrace";
import { EmptyPlayersList } from "./EmptyPlayersList";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersList() {
  usePerfRenderCount("GamePlayersList");
  usePerfMountTracker("GamePlayersList");

  const { game } = useGame(undefined, {
    resolve: {
      players: {
        $each: {
          name: true,
          handicap: true,
          ghinId: true,
        },
      },
      rounds: {
        $each: {
          round: {
            playerId: true,
            course: true,
            tee: {
              ratings: true,
            },
            handicapIndex: true,
          },
          handicapIndex: true,
          courseHandicap: true,
          gameHandicap: true,
        },
      },
      spec: true,
    },
    select: (g) => {
      if (!g.$isLoaded) return null;
      if (!g.players?.$isLoaded) return null;
      return g;
    },
  });
  const navigation = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: {
          handicap: true,
        },
      },
    },
  });

  const players =
    game?.$isLoaded && game.players?.$isLoaded
      ? game.players.filter((p) => p?.$isLoaded)
      : [];

  // Build playerId → RoundToGame lookup from the single parent subscription
  // This replaces 48 individual useGame() calls in each GamePlayersListItem
  const roundToGameByPlayer = new Map<string, MaybeLoaded<RoundToGame>>();
  if (game?.$isLoaded && game.rounds?.$isLoaded) {
    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded) continue;
      if (!rtg.round?.$isLoaded) continue;
      const playerId = rtg.round.playerId;
      if (playerId) {
        roundToGameByPlayer.set(playerId, rtg);
      }
    }
  }

  // Get handicap mode from game options (default is "low")
  const handicapIndexFromValue = useOptionValue(
    game,
    null,
    "handicap_index_from",
    "game",
  );
  const handicapMode = handicapIndexFromValue === "full" ? "full" : "low";

  // Calculate adjusted handicaps map when in "low" mode
  // This gives us "shots off" for each player relative to the lowest handicap
  const adjustedHandicaps = ((): Map<string, number> | null => {
    if (handicapMode !== "low") return null;
    if (!game?.$isLoaded) return null;
    if (!game.$jazz.has("rounds") || !game.rounds?.$isLoaded) return null;

    const playerHandicaps: PlayerHandicap[] = [];

    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded) continue;
      if (!rtg.$jazz.has("round") || !rtg.round?.$isLoaded) continue;

      const round = rtg.round;
      if (!round.$jazz.has("playerId")) continue;
      const playerId = round.playerId;
      if (!playerId) continue;

      // Get courseHandicap: prefer stored value, else calculate from tee data
      let courseHandicap = rtg.$jazz.has("courseHandicap")
        ? rtg.courseHandicap
        : undefined;
      if (courseHandicap === undefined) {
        const tee = round.$jazz.has("tee") ? round.tee : undefined;
        if (
          tee?.$isLoaded &&
          rtg.$jazz.has("handicapIndex") &&
          rtg.handicapIndex !== undefined
        ) {
          const calculated = calculateCourseHandicap({
            handicapIndex: String(rtg.handicapIndex),
            tee,
            holesPlayed: "all18",
          });
          courseHandicap = calculated ?? 0;
        } else {
          courseHandicap = 0;
        }
      }

      playerHandicaps.push({
        playerId,
        courseHandicap,
        gameHandicap: rtg.$jazz.has("gameHandicap")
          ? rtg.gameHandicap
          : undefined,
      });
    }

    if (playerHandicaps.length === 0) return null;
    return adjustHandicapsToLow(playerHandicaps);
  })();

  // Check if current player is already in the game
  // Computed directly - no useMemo needed since this is a simple check
  // and Jazz reactive updates will trigger re-renders when data loads
  const isMeInGame = (() => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.player?.$isLoaded) {
      return true; // Hide button if we can't determine
    }
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return true;
    }

    const myPlayerId = me.root.player.$jazz.id;
    const myGhinId = me.root.player.ghinId;

    return game.players.some((p) => {
      if (!p?.$isLoaded) return false;
      // Match by Jazz ID or GHIN ID
      return p.$jazz.id === myPlayerId || (myGhinId && p.ghinId === myGhinId);
    });
  })();

  const [isAddingMe, setIsAddingMe] = useState(false);

  // No useCallback - Jazz CoValues (me) as dependencies don't work correctly
  // because Jazz object references don't change when nested data loads
  const handleAddMe = async () => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.player?.$isLoaded) {
      return;
    }

    setIsAddingMe(true);
    try {
      // Pass player reference directly, not extracted data
      const result = await addPlayerToGame(me.root.player);

      if (result.isOk()) {
        const { player, roundAutoCreated } = result.value;
        if (!roundAutoCreated) {
          // Need to select or create a round
          navigation.navigate("AddRoundToGame", {
            playerId: player.$jazz.id,
          });
        }
        // If roundAutoCreated, do nothing - we're already on the player list.
        // Note: This differs from PlayerItem/AddPlayerFavorites which call goBack()
        // because those are nested inside AddPlayerNavigator.
      } else {
        console.error("Failed to add me to game:", result.error);
      }
    } finally {
      setIsAddingMe(false);
    }
  };

  // Stable keyExtractor (doesn't depend on render-scoped data)
  const extractPlayerKey = useCallback((item: Player) => item.$jazz.id, []);

  // renderItem closes over roundToGameByPlayer and adjustedHandicaps
  // which change each render, so useCallback won't help here.
  // The real win is eliminating 48 useGame() subscriptions in children.
  const renderPlayerItem = ({ item }: { item: Player }) => (
    <GamePlayersListItem
      player={item}
      roundToGame={roundToGameByPlayer.get(item.$jazz.id)}
      shotsOff={adjustedHandicaps?.get(item.$jazz.id) ?? null}
    />
  );

  return (
    <View>
      <View style={styles.buttonRow}>
        <View style={styles.addPlayerButton}>
          <Button
            label="Add Player"
            onPress={() => navigation.navigate("AddPlayerNavigator")}
          />
        </View>
        {!isMeInGame && (
          <Button label="Add Me" onPress={handleAddMe} disabled={isAddingMe} />
        )}
      </View>
      <FlatList
        data={players}
        renderItem={renderPlayerItem}
        keyExtractor={extractPlayerKey}
        ListEmptyComponent={<EmptyPlayersList />}
        contentContainerStyle={styles.flatlist}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  addPlayerButton: {
    flex: 1,
  },
  flatlist: {
    marginVertical: theme.gap(1),
  },
}));
