import { useMemo, useRef } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import {
  getHoleRows,
  getPlayerColumns,
  type HoleData,
  LeaderboardTable,
  type PlayerColumn,
} from "@/components/game/leaderboard";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import { useScoreboard } from "@/hooks/useScoreboard";
import { ButtonGroup, Screen, Text } from "@/ui";

/**
 * Create a fingerprint for player columns data.
 * Only changes when player names actually change.
 */
function createPlayerColumnsFingerprint(game: Game | null): string | null {
  if (!game?.$isLoaded || !game.players?.$isLoaded) return null;

  const parts: string[] = [];
  for (const player of game.players) {
    if (!player?.$isLoaded) continue;
    parts.push(`${player.$jazz.id}:${player.name ?? ""}`);
  }
  return parts.join("|");
}

/**
 * Create a fingerprint for hole rows data.
 * Only changes when tee hole data actually changes.
 */
function createHoleRowsFingerprint(game: Game | null): string | null {
  if (!game?.$isLoaded || !game.rounds?.$isLoaded || game.rounds.length === 0) {
    return null;
  }

  const firstRtg = game.rounds[0];
  if (!firstRtg?.$isLoaded) return null;

  const round = firstRtg.round;
  if (!round?.$isLoaded) return null;

  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return null;

  const parts: string[] = [];
  for (const hole of tee.holes) {
    if (!hole?.$isLoaded) continue;
    parts.push(`${hole.number ?? ""}:${hole.par ?? ""}`);
  }
  return parts.join("|");
}

export function GameLeaderboard(): React.ReactElement | null {
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

  // Create fingerprints for derived data - these only change when actual data changes,
  // not when Jazz object references change during progressive loading
  const playerColumnsFingerprint = createPlayerColumnsFingerprint(game);
  const holeRowsFingerprint = createHoleRowsFingerprint(game);

  // Ref caching for player columns - prevents recomputation on game reference changes
  const lastPlayerColumnsFingerprint = useRef<string | null>(null);
  const cachedPlayerColumns = useRef<PlayerColumn[]>([]);

  // Ref caching for hole rows - prevents recomputation on game reference changes
  const lastHoleRowsFingerprint = useRef<string | null>(null);
  const cachedHoleRows = useRef<HoleData[]>([]);

  // Memoize player columns based on fingerprint with ref caching
  const playerColumns = useMemo((): PlayerColumn[] => {
    if (!game || playerColumnsFingerprint === null) return [];

    // Return cached if fingerprint unchanged
    if (
      playerColumnsFingerprint === lastPlayerColumnsFingerprint.current &&
      cachedPlayerColumns.current.length > 0
    ) {
      return cachedPlayerColumns.current;
    }

    const result = getPlayerColumns(game);
    lastPlayerColumnsFingerprint.current = playerColumnsFingerprint;
    cachedPlayerColumns.current = result;
    return result;
  }, [playerColumnsFingerprint, game]);

  // Memoize hole rows based on fingerprint with ref caching
  const holeRows = useMemo((): HoleData[] => {
    if (!game || holeRowsFingerprint === null) return [];

    // Return cached if fingerprint unchanged
    if (
      holeRowsFingerprint === lastHoleRowsFingerprint.current &&
      cachedHoleRows.current.length > 0
    ) {
      return cachedHoleRows.current;
    }

    const result = getHoleRows(game);
    lastHoleRowsFingerprint.current = holeRowsFingerprint;
    cachedHoleRows.current = result;
    return result;
  }, [holeRowsFingerprint, game]);

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
