import { memo, useMemo } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Scoreboard } from "spicylib/scoring";
import { IncompleteIndicator } from "@/components/game/scoring";
import { Text } from "@/ui";
import {
  getPopsCount,
  getScoreToPar,
  getScoreValue,
  getSummaryValue,
  type HoleData,
  type PlayerColumn,
  type ViewMode,
} from "./leaderboardUtils";
import { ScoreCell } from "./ScoreCell";

interface LeaderboardTableProps {
  playerColumns: PlayerColumn[];
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
}

// Threshold for switching to constrained column widths
const MAX_PLAYERS_FOR_STRETCH = 4;

export const LeaderboardTable = memo(function LeaderboardTable({
  playerColumns,
  holeRows,
  scoreboard,
  viewMode,
}: LeaderboardTableProps) {
  const { width: screenWidth } = useWindowDimensions();

  // For ≤4 players, let columns stretch to fill screen width
  const shouldStretch = playerColumns.length <= MAX_PLAYERS_FOR_STRETCH;

  // Pre-compute all cell data once when scoreboard/viewMode changes
  const cellData = useMemo(() => {
    const data: Map<
      string,
      { value: number | null; scoreToPar: number | null; popsCount: number }
    > = new Map();

    for (const row of holeRows) {
      for (const player of playerColumns) {
        const key = `${row.hole}-${player.playerId}`;

        const value =
          row.isSummaryRow && row.summaryType
            ? getSummaryValue(
                scoreboard,
                player.playerId,
                row.summaryType,
                viewMode,
              )
            : getScoreValue(scoreboard, player.playerId, row.hole, viewMode);

        const scoreToPar = row.isSummaryRow
          ? null
          : getScoreToPar(scoreboard, player.playerId, row.hole, viewMode);

        const popsCount = row.isSummaryRow
          ? 0
          : getPopsCount(scoreboard, player.playerId, row.hole);

        data.set(key, { value, scoreToPar, popsCount });
      }
    }

    return data;
  }, [scoreboard, playerColumns, holeRows, viewMode]);

  return (
    <ScrollView style={styles.tableContainer} nestedScrollEnabled>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={
          shouldStretch ? { width: screenWidth } : undefined
        }
      >
        <View
          style={
            shouldStretch ? { width: screenWidth } : { minWidth: screenWidth }
          }
        >
          {/* Header Row - Player Names (vertical text) */}
          <View style={styles.headerRow}>
            <View style={styles.holeColumn}>
              <Text style={styles.headerLabel}>Hole</Text>
            </View>
            {playerColumns.map((player) => (
              <View
                key={player.playerId}
                style={[
                  styles.playerColumn,
                  shouldStretch && styles.playerColumnStretch,
                ]}
              >
                <View style={styles.verticalTextContainer}>
                  <View
                    style={[
                      styles.verticalTextWrapper,
                      shouldStretch && styles.verticalTextWrapperStretch,
                    ]}
                  >
                    <Text style={styles.verticalFirstName}>
                      {player.firstName}
                    </Text>
                    <Text style={styles.verticalLastName}>
                      {player.lastName}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Score Rows */}
          {holeRows.map((row) => {
            // Check if this hole has incomplete scoring warnings
            const holeWarnings = row.isSummaryRow
              ? undefined
              : scoreboard?.holes?.[row.hole]?.warnings;
            const warningMessage = holeWarnings?.[0]?.message;

            return (
              <View
                key={row.hole}
                style={[styles.dataRow, row.isSummaryRow && styles.summaryRow]}
              >
                <View style={styles.holeColumn}>
                  <View style={styles.holeCell}>
                    <Text
                      style={[
                        styles.holeText,
                        row.isSummaryRow && styles.summaryText,
                      ]}
                    >
                      {row.hole}
                    </Text>
                    {warningMessage && (
                      <View style={styles.holeWarning}>
                        <IncompleteIndicator
                          message={warningMessage}
                          size={8}
                        />
                      </View>
                    )}
                  </View>
                </View>
                {playerColumns.map((player) => {
                  const key = `${row.hole}-${player.playerId}`;
                  const cell = cellData.get(key) ?? {
                    value: null,
                    scoreToPar: null,
                    popsCount: 0,
                  };

                  return (
                    <View
                      key={player.playerId}
                      style={[
                        styles.playerColumn,
                        shouldStretch && styles.playerColumnStretch,
                      ]}
                    >
                      <ScoreCell
                        value={cell.value}
                        scoreToPar={cell.scoreToPar}
                        popsCount={cell.popsCount}
                        isSummaryRow={row.isSummaryRow}
                        viewMode={viewMode}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
});

const styles = StyleSheet.create((theme) => ({
  tableContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: theme.gap(0.25),
  },
  dataRow: {
    flexDirection: "row",
    minHeight: 26,
    alignItems: "center",
  },
  summaryRow: {
    backgroundColor: theme.colors.border,
  },
  holeColumn: {
    minWidth: 48,
    paddingHorizontal: theme.gap(1),
    justifyContent: "center",
    alignItems: "center",
  },
  holeCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  holeWarning: {
    marginLeft: 3,
  },
  playerColumn: {
    flex: 1,
    minWidth: 54,
    maxWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  playerColumnStretch: {
    maxWidth: undefined,
  },
  headerLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  verticalTextContainer: {
    justifyContent: "flex-end",
    height: 60,
    width: "100%",
    overflow: "visible",
  },
  verticalTextWrapper: {
    transform: [{ rotate: "-55deg" }],
    transformOrigin: "left bottom",
    marginLeft: 40,
    width: 80,
  },
  verticalTextWrapperStretch: {
    marginLeft: 54,
  },
  verticalFirstName: {
    fontSize: 11,
    color: theme.colors.primary,
    lineHeight: 13,
  },
  verticalLastName: {
    fontSize: 11,
    color: theme.colors.primary,
    lineHeight: 13,
  },
  holeText: {
    fontSize: 13,
    color: theme.colors.primary,
    textAlign: "center",
  },
  summaryText: {
    fontWeight: "bold",
  },
}));
