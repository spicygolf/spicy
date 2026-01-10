import { ScrollView, useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Scoreboard } from "spicylib/scoring";
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

export function LeaderboardTable({
  playerColumns,
  holeRows,
  scoreboard,
  viewMode,
}: LeaderboardTableProps) {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <ScrollView style={styles.tableContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: screenWidth }}>
          {/* Header Row - Player Names (vertical text) */}
          <View style={styles.headerRow}>
            <View style={styles.holeColumn}>
              <Text style={styles.headerLabel}>Hole</Text>
            </View>
            {playerColumns.map((player) => (
              <View key={player.playerId} style={styles.playerColumn}>
                <View style={styles.verticalTextContainer}>
                  <View style={styles.verticalTextWrapper}>
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
          {holeRows.map((row) => (
            <View
              key={row.hole}
              style={[styles.dataRow, row.isSummaryRow && styles.summaryRow]}
            >
              <View style={styles.holeColumn}>
                <Text
                  style={[
                    styles.holeText,
                    row.isSummaryRow && styles.summaryText,
                  ]}
                >
                  {row.hole}
                </Text>
              </View>
              {playerColumns.map((player) => {
                const value =
                  row.isSummaryRow && row.summaryType
                    ? getSummaryValue(
                        scoreboard,
                        player.playerId,
                        row.summaryType,
                        viewMode,
                      )
                    : getScoreValue(
                        scoreboard,
                        player.playerId,
                        row.hole,
                        viewMode,
                      );

                const scoreToPar = row.isSummaryRow
                  ? null
                  : getScoreToPar(
                      scoreboard,
                      player.playerId,
                      row.hole,
                      viewMode,
                    );

                const popsCount = row.isSummaryRow
                  ? 0
                  : getPopsCount(scoreboard, player.playerId, row.hole);

                return (
                  <View key={player.playerId} style={styles.playerColumn}>
                    <ScoreCell
                      value={value}
                      scoreToPar={scoreToPar}
                      popsCount={popsCount}
                      isSummaryRow={row.isSummaryRow}
                      viewMode={viewMode}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

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
    width: 40,
    paddingLeft: theme.gap(1),
    justifyContent: "center",
  },
  playerColumn: {
    flex: 1,
    minWidth: 54,
    maxWidth: 80,
    alignItems: "center",
    justifyContent: "center",
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
  },
  summaryText: {
    fontWeight: "bold",
  },
}));
