import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Payout, PlayerQuota, Scoreboard } from "spicylib/scoring";
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
  payouts?: Payout[] | null;
  placesPaid?: number;
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
 * Sort player data by a column value and assign rank labels.
 *
 * When settlement payouts exist for the sort column, uses the settlement
 * engine's pre-computed rank labels (single source of truth). Falls back
 * to rankWithTies for columns without settlement data (e.g., "$" net).
 */
function sortAndRankPlayerData(
  data: VerticalPlayerData[],
  sort: SortState | null,
  columns: VerticalColumn[],
  betPayoutLookup: Map<string, Map<string, BetPayoutInfo>> | null,
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

  // Check if settlement payouts exist for this column
  const hasSettlementData =
    betPayoutLookup !== null &&
    [...betPayoutLookup.values()].some((m) => m.has(sort.columnKey));

  // Sort by column value with rankWithTies (needed for ordering either way)
  const ranked = rankWithTies(
    withValues,
    (p) => p.values[sort.columnKey] as number,
    sort.direction === "asc" ? "lower" : "higher",
  );

  // Fallback: placesPaid for columns without settlement data (e.g., "$")
  const activeColumn = columns.find((c) => c.key === sort.columnKey);
  const placesPaid = activeColumn?.placesPaid;

  const result: RankedPlayer[] = ranked.map(({ item, rank, tieCount }) => {
    if (hasSettlementData) {
      // Use settlement engine's pre-computed rank label
      const payout = betPayoutLookup?.get(item.playerId)?.get(sort.columnKey);
      return { player: item, rankLabel: payout?.rankLabel ?? "" };
    }
    // Fallback: compute rank label from rankWithTies (for "$" column etc.)
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

/** Per-bet payout info for a single player on a single pool. */
export interface BetPayoutInfo {
  rankLabel: string;
  amount: number;
}

/**
 * Index payouts by playerId → poolName for fast lookup.
 * rankLabel is pre-computed by the settlement engine.
 */
function buildBetPayoutLookup(
  payouts: Payout[],
): Map<string, Map<string, BetPayoutInfo>> {
  const result = new Map<string, Map<string, BetPayoutInfo>>();
  for (const p of payouts) {
    if (p.amount <= 0) continue;
    let playerMap = result.get(p.playerId);
    if (!playerMap) {
      playerMap = new Map();
      result.set(p.playerId, playerMap);
    }
    playerMap.set(p.poolName, { rankLabel: p.rankLabel, amount: p.amount });
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
  payouts,
  placesPaid,
}: VerticalLeaderboardProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);

  const columns = useMemo(() => {
    const base = getVerticalColumns(bets);
    if (payouts) {
      return [
        ...base,
        {
          key: "$",
          label: "$",
          summaryType: "total" as const,
          placesPaid,
        },
      ];
    }
    return base;
  }, [bets, payouts, placesPaid]);

  // Default sort to payout column when settlement data is available
  useEffect(
    function setDefaultPayoutSort() {
      if (payouts && sort === null) {
        setSort({ columnKey: "$", direction: "desc" });
      }
    },
    [payouts, sort],
  );

  const playerData = useMemo(() => {
    const data = getVerticalPlayerData(
      scoreboard,
      playerColumns,
      columns,
      SUMMARY_VIEW_MODE,
      playerQuotas,
    );
    if (payouts) {
      // Sum gross payouts per player (what they collect, not net profit)
      const grossByPlayer = new Map<string, number>();
      for (const p of payouts) {
        if (p.amount > 0) {
          grossByPlayer.set(
            p.playerId,
            (grossByPlayer.get(p.playerId) ?? 0) + p.amount,
          );
        }
      }
      for (const player of data) {
        const gross = grossByPlayer.get(player.playerId) ?? 0;
        player.values["$"] = gross > 0 ? gross : null;
      }
    }
    return data;
  }, [scoreboard, playerColumns, columns, playerQuotas, payouts]);

  const betPayoutLookup = useMemo(
    () => (payouts ? buildBetPayoutLookup(payouts) : null),
    [payouts],
  );

  const rankedPlayers = useMemo(
    () => sortAndRankPlayerData(playerData, sort, columns, betPayoutLookup),
    [playerData, sort, columns, betPayoutLookup],
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
          betPayouts={betPayoutLookup?.get(player.playerId) ?? null}
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
