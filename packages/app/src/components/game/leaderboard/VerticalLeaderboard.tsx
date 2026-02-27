import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import { rankWithTies } from "spicylib/scoring";
import { Text } from "@/ui";
import {
  type BetColumnInfo,
  getVerticalColumns,
  getVerticalPlayerData,
  type HoleData,
  type PlayerColumn,
  type VerticalColumn,
  type VerticalPlayerData,
  type ViewMode,
} from "./leaderboardUtils";
import { VerticalPlayerRow } from "./VerticalPlayerRow";

interface VerticalLeaderboardProps {
  playerColumns: PlayerColumn[];
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  playerQuotas?: Map<string, PlayerQuota> | null;
  bets: BetColumnInfo[];
}

type SortDirection = "asc" | "desc";

interface SortState {
  columnKey: string;
  direction: SortDirection;
}

interface RankedPlayer {
  player: VerticalPlayerData;
  rankLabel: string;
}

/**
 * Sort player data by a column value and compute tie-aware rank labels.
 * Uses rankWithTies from the scoring engine for proper golf ranking.
 * Players beyond placesPaid get an empty rank label.
 */
function sortAndRankPlayerData(
  data: VerticalPlayerData[],
  sort: SortState | null,
  columns: VerticalColumn[],
): RankedPlayer[] {
  if (!sort) {
    return data.map((player) => ({
      player,
      rankLabel: String(player.rank),
    }));
  }

  // Split into players with values and players with nulls
  const withValues = data.filter(
    (p) =>
      p.values[sort.columnKey] !== null &&
      p.values[sort.columnKey] !== undefined,
  );
  const withoutValues = data.filter(
    (p) =>
      p.values[sort.columnKey] === null ||
      p.values[sort.columnKey] === undefined,
  );

  // Use rankWithTies for proper tie handling
  const ranked = rankWithTies(
    withValues,
    (p) => p.values[sort.columnKey] as number,
    sort.direction === "asc" ? "lower" : "higher",
  );

  // Find placesPaid for the active sort column
  const activeColumn = columns.find((c) => c.key === sort.columnKey);
  const placesPaid = activeColumn?.placesPaid;

  const result: RankedPlayer[] = ranked.map(({ item, rank, tieCount }) => {
    // Beyond places paid = no rank
    if (placesPaid !== undefined && rank > placesPaid) {
      return { player: item, rankLabel: "" };
    }
    const label = tieCount > 1 ? `T${rank}` : String(rank);
    return { player: item, rankLabel: label };
  });

  // Append null-value players at the bottom with no rank
  for (const player of withoutValues) {
    result.push({ player, rankLabel: "" });
  }

  return result;
}

/** Summary columns always show "points" mode (skins columns override to "skins") */
const SUMMARY_VIEW_MODE: ViewMode = "points";

export const VerticalLeaderboard = memo(function VerticalLeaderboard({
  playerColumns,
  holeRows,
  scoreboard,
  playerQuotas,
  bets,
}: VerticalLeaderboardProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);

  const columns = useMemo(() => getVerticalColumns(bets), [bets]);

  const playerData = useMemo(
    () =>
      getVerticalPlayerData(
        scoreboard,
        playerColumns,
        columns,
        SUMMARY_VIEW_MODE,
        playerQuotas,
      ),
    [scoreboard, playerColumns, columns, playerQuotas],
  );

  const rankedPlayers = useMemo(
    () => sortAndRankPlayerData(playerData, sort, columns),
    [playerData, sort, columns],
  );

  const handleToggle = useCallback((playerId: string) => {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  }, []);

  const handleColumnPress = useCallback((columnKey: string) => {
    setSort((prev) => {
      if (prev?.columnKey === columnKey) {
        return {
          columnKey,
          direction: prev.direction === "desc" ? "asc" : "desc",
        };
      }
      // Default to descending (highest first, natural for points/skins)
      return { columnKey, direction: "desc" };
    });
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerPlayerCell}>
          <Text style={styles.headerText}>Player</Text>
        </View>
        <View style={styles.headerValues}>
          {columns.map((col) => {
            const isActive = sort?.columnKey === col.key;
            const arrow = isActive
              ? sort.direction === "asc"
                ? " \u25B4"
                : " \u25BE"
              : "";
            return (
              <Pressable
                key={col.key}
                style={styles.headerValueCell}
                onPress={() => handleColumnPress(col.key)}
              >
                <Text
                  style={[
                    styles.headerText,
                    isActive && styles.headerTextActive,
                  ]}
                >
                  {col.label}
                  {arrow}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Player rows */}
      {rankedPlayers.map(({ player, rankLabel }) => (
        <VerticalPlayerRow
          key={player.playerId}
          playerId={player.playerId}
          firstName={player.firstName}
          lastName={player.lastName}
          rankLabel={rankLabel}
          summaryValues={player.values}
          columns={columns}
          isExpanded={expandedPlayerId === player.playerId}
          onToggle={handleToggle}
          holeRows={holeRows}
          scoreboard={scoreboard}
          playerQuotas={playerQuotas}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerPlayerCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    // Account for rank badge width (24) + marginLeft (4)
    paddingLeft: 28,
  },
  headerValues: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerValueCell: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  headerText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  headerTextActive: {
    color: theme.colors.primary,
  },
}));
