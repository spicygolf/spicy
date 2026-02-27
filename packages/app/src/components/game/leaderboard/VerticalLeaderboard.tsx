import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import { Text } from "@/ui";
import {
  type BetColumnInfo,
  getVerticalColumns,
  getVerticalPlayerData,
  type HoleData,
  type PlayerColumn,
  type VerticalPlayerData,
  type ViewMode,
} from "./leaderboardUtils";
import { VerticalPlayerRow } from "./VerticalPlayerRow";

interface VerticalLeaderboardProps {
  playerColumns: PlayerColumn[];
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
  playerQuotas?: Map<string, PlayerQuota> | null;
  bets: BetColumnInfo[];
}

type SortDirection = "asc" | "desc";

interface SortState {
  columnKey: string;
  direction: SortDirection;
}

/**
 * Sort player data by a column value.
 * Null values sort to the bottom regardless of direction.
 */
function sortPlayerData(
  data: VerticalPlayerData[],
  sort: SortState | null,
): VerticalPlayerData[] {
  if (!sort) return data;

  return [...data].sort((a, b) => {
    const aVal = a.values[sort.columnKey];
    const bVal = b.values[sort.columnKey];

    // Nulls to bottom
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    const diff = aVal - bVal;
    return sort.direction === "asc" ? diff : -diff;
  });
}

export const VerticalLeaderboard = memo(function VerticalLeaderboard({
  playerColumns,
  holeRows,
  scoreboard,
  viewMode,
  playerQuotas,
  bets,
}: VerticalLeaderboardProps) {
  const { theme } = useUnistyles();
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);

  const columns = useMemo(() => getVerticalColumns(bets), [bets]);

  const playerData = useMemo(
    () =>
      getVerticalPlayerData(
        scoreboard,
        playerColumns,
        columns,
        viewMode,
        playerQuotas,
      ),
    [scoreboard, playerColumns, columns, viewMode, playerQuotas],
  );

  const sortedPlayerData = useMemo(
    () => sortPlayerData(playerData, sort),
    [playerData, sort],
  );

  const handleToggle = useCallback((playerId: string) => {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  }, []);

  const handleColumnPress = useCallback((columnKey: string) => {
    setSort((prev) => {
      if (prev?.columnKey === columnKey) {
        // Toggle direction
        return {
          columnKey,
          direction: prev.direction === "desc" ? "asc" : "desc",
        };
      }
      // New column: default to descending (highest first, natural for points/skins)
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
                </Text>
                {isActive && (
                  <FontAwesome6
                    name={sort.direction === "asc" ? "caret-up" : "caret-down"}
                    iconStyle="solid"
                    size={8}
                    color={theme.colors.primary}
                    style={styles.sortIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        {/* Spacer for chevron width */}
        <View style={styles.headerChevronSpacer} />
      </View>

      {/* Player rows */}
      {sortedPlayerData.map((player) => (
        <VerticalPlayerRow
          key={player.playerId}
          playerId={player.playerId}
          firstName={player.firstName}
          lastName={player.lastName}
          rank={player.rank}
          summaryValues={player.values}
          columns={columns}
          isExpanded={expandedPlayerId === player.playerId}
          onToggle={() => handleToggle(player.playerId)}
          holeRows={holeRows}
          scoreboard={scoreboard}
          viewMode={viewMode}
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
    paddingHorizontal: theme.gap(1.5),
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
    width: 48,
    alignItems: "center",
  },
  headerChevronSpacer: {
    width: 24,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  headerTextActive: {
    color: theme.colors.primary,
  },
  sortIcon: {
    marginTop: 1,
  },
}));
