import { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  getHoleRows,
  getPlayerColumns,
  LeaderboardTable,
} from "@/components/game/leaderboard";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import { useScoreboard } from "@/hooks/useScoreboard";
import { ButtonGroup, Screen, Text } from "@/ui";

export function GameLeaderboard() {
  const { leaderboardViewMode: viewMode, setLeaderboardViewMode } =
    useGameContext();

  const { game } = useGame(undefined, {
    resolve: {
      name: true,
      players: { $each: { name: true, handicap: true } },
      rounds: {
        $each: {
          handicapIndex: true,
          courseHandicap: true,
          gameHandicap: true,
          round: {
            playerId: true,
            scores: { $each: true },
            tee: { holes: true },
          },
        },
      },
      specs: {
        $each: {
          options: { $each: true },
        },
      },
      options: { $each: true },
      holes: {
        $each: {
          teams: {
            $each: {
              options: { $each: true }, // Needed for inherited multiplier checking
            },
          },
        },
      },
    },
  });

  const scoreResult = useScoreboard(game);
  const scoreboard = scoreResult?.scoreboard ?? null;

  // Memoize player columns - only recalculate when players change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional optimization - we only want to recompute when players changes, not on every game reference change from Jazz progressive loading
  const playerColumns = useMemo(() => {
    if (!game) return [];
    return getPlayerColumns(game);
  }, [game?.players]);

  // Memoize hole rows - only recalculate when rounds/tee data changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional optimization - we only want to recompute when rounds changes, not on every game reference change from Jazz progressive loading
  const holeRows = useMemo(() => {
    if (!game) return [];
    return getHoleRows(game);
  }, [game?.rounds]);

  if (!game) {
    return null;
  }

  if (playerColumns.length === 0) {
    return (
      <Screen>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No players in game</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <ButtonGroup
          buttons={[
            { label: "gross", onPress: () => setLeaderboardViewMode("gross") },
            { label: "net", onPress: () => setLeaderboardViewMode("net") },
            {
              label: "points",
              onPress: () => setLeaderboardViewMode("points"),
            },
          ]}
          selectedIndex={viewMode === "gross" ? 0 : viewMode === "net" ? 1 : 2}
        />
      </View>

      {/* Leaderboard Table */}
      <LeaderboardTable
        playerColumns={playerColumns}
        holeRows={holeRows}
        scoreboard={scoreboard}
        viewMode={viewMode}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: theme.gap(2),
    paddingTop: theme.gap(0.75),
    paddingBottom: theme.gap(0.25),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.secondary,
    fontSize: 16,
  },
}));
