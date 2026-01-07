import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
import { useGame } from "@/hooks";
import { useScoreboard } from "@/hooks/useScoreboard";
import { ButtonGroup, Screen, Text } from "@/ui";

type ViewMode = "gross" | "net" | "points";

interface PlayerColumn {
  playerId: string;
  firstName: string;
  lastName: string;
}

interface HoleData {
  hole: string;
  par: number;
  isSummaryRow: boolean;
  summaryType?: "out" | "in" | "total";
}

/**
 * Get player columns from game data
 */
function getPlayerColumns(game: Game): PlayerColumn[] {
  if (!game.players?.$isLoaded) return [];

  const columns: PlayerColumn[] = [];
  for (const player of game.players) {
    if (!player?.$isLoaded) continue;

    const nameParts = player.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    columns.push({
      playerId: player.$jazz.id,
      firstName,
      lastName,
    });
  }
  return columns;
}

/**
 * Get hole rows including Out/In/Total summary rows
 */
function getHoleRows(game: Game): HoleData[] {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) return [];

  // Get par for each hole from the first player's tee
  const firstRtg = game.rounds[0];
  if (!firstRtg?.$isLoaded) return [];

  const round = firstRtg.round;
  if (!round?.$isLoaded || !round.$jazz.has("tee")) return [];

  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return [];

  const rows: HoleData[] = [];
  const holeCount = tee.holes.length;
  const hasFrontNine = holeCount >= 9;
  const hasBackNine = holeCount >= 18;

  // Front 9
  for (let i = 0; i < Math.min(9, holeCount); i++) {
    const hole = tee.holes[i];
    if (hole?.$isLoaded) {
      rows.push({
        hole: hole.number?.toString() || String(i + 1),
        par: hole.par ?? 4,
        isSummaryRow: false,
      });
    }
  }

  // Out row (front 9 summary)
  if (hasFrontNine) {
    rows.push({
      hole: "Out",
      par: 0, // Will be calculated
      isSummaryRow: true,
      summaryType: "out",
    });
  }

  // Back 9
  for (let i = 9; i < Math.min(18, holeCount); i++) {
    const hole = tee.holes[i];
    if (hole?.$isLoaded) {
      rows.push({
        hole: hole.number?.toString() || String(i + 1),
        par: hole.par ?? 4,
        isSummaryRow: false,
      });
    }
  }

  // In row (back 9 summary)
  if (hasBackNine) {
    rows.push({
      hole: "In",
      par: 0,
      isSummaryRow: true,
      summaryType: "in",
    });
  }

  // Total row
  if (holeCount > 0) {
    rows.push({
      hole: "Total",
      par: 0,
      isSummaryRow: true,
      summaryType: "total",
    });
  }

  return rows;
}

/**
 * Get score value for a player on a hole
 */
function getScoreValue(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
  viewMode: ViewMode,
): number | null {
  if (!scoreboard) return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return null;

  switch (viewMode) {
    case "gross":
      return playerResult.gross;
    case "net":
      return playerResult.net;
    case "points":
      return playerResult.points;
  }
}

/**
 * Get summary value (Out/In/Total) for a player
 */
function getSummaryValue(
  scoreboard: Scoreboard | null,
  playerId: string,
  summaryType: "out" | "in" | "total",
  viewMode: ViewMode,
): number | null {
  if (!scoreboard) return null;

  const cumulative = scoreboard.cumulative.players[playerId];
  if (!cumulative) return null;

  // For points, calculate from individual holes
  if (viewMode === "points") {
    let total = 0;
    const holes = Object.keys(scoreboard.holes);

    for (const hole of holes) {
      const holeNum = Number.parseInt(hole, 10);
      if (Number.isNaN(holeNum)) continue;

      const inRange =
        summaryType === "out"
          ? holeNum >= 1 && holeNum <= 9
          : summaryType === "in"
            ? holeNum >= 10 && holeNum <= 18
            : true;

      if (inRange) {
        const playerResult = scoreboard.holes[hole]?.players[playerId];
        if (playerResult) {
          total += playerResult.points;
        }
      }
    }
    return total;
  }

  // For gross/net, calculate from holes
  let total = 0;
  const holes = Object.keys(scoreboard.holes);

  for (const hole of holes) {
    const holeNum = Number.parseInt(hole, 10);
    if (Number.isNaN(holeNum)) continue;

    const inRange =
      summaryType === "out"
        ? holeNum >= 1 && holeNum <= 9
        : summaryType === "in"
          ? holeNum >= 10 && holeNum <= 18
          : true;

    if (inRange) {
      const playerResult = scoreboard.holes[hole]?.players[playerId];
      if (playerResult) {
        total += viewMode === "gross" ? playerResult.gross : playerResult.net;
      }
    }
  }

  return total || null;
}

/**
 * Check if player has junk on a hole
 */
function hasJunk(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
): boolean {
  if (!scoreboard) return false;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return false;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return false;

  return playerResult.junk.length > 0;
}

/**
 * Get score-to-par for decoration
 */
function getScoreToPar(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
  viewMode: ViewMode,
): number | null {
  if (!scoreboard || viewMode === "points") return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return null;

  // For gross: gross - par, for net: net - par
  return viewMode === "gross" ? playerResult.scoreToPar : playerResult.netToPar;
}

/**
 * Score cell with circle/square notation
 */
function ScoreCell({
  value,
  scoreToPar,
  hasJunkDot,
  isSummaryRow,
  viewMode,
}: {
  value: number | null;
  scoreToPar: number | null;
  hasJunkDot: boolean;
  isSummaryRow: boolean;
  viewMode: ViewMode;
}) {
  const { theme } = useUnistyles();

  if (value === null) {
    return <View style={styles.scoreCell} />;
  }

  // Format value
  let displayValue = String(value);
  if (viewMode === "points" && value > 0) {
    displayValue = `+${value}`;
  } else if (viewMode === "points" && value < 0) {
    displayValue = String(value);
  }

  // Get decoration for gross/net views (not points, not summary)
  const decoration =
    !isSummaryRow && viewMode !== "points" && scoreToPar !== null
      ? getScoreDecoration(scoreToPar)
      : null;

  const decorationColor =
    scoreToPar !== null ? getDecorationColor(scoreToPar, theme) : undefined;

  return (
    <View style={styles.scoreCell}>
      <View style={styles.scoreCellContent}>
        {/* Score with decoration */}
        {decoration === "double-circle" ? (
          <View style={[styles.outerCircle, { borderColor: decorationColor }]}>
            <View
              style={[styles.innerCircle, { borderColor: decorationColor }]}
            >
              <Text style={styles.scoreCellText}>{displayValue}</Text>
            </View>
          </View>
        ) : decoration === "single-circle" ? (
          <View style={[styles.singleCircle, { borderColor: decorationColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        ) : decoration === "double-square" ? (
          <View style={[styles.outerSquare, { borderColor: decorationColor }]}>
            <View
              style={[styles.innerSquare, { borderColor: decorationColor }]}
            >
              <Text style={styles.scoreCellText}>{displayValue}</Text>
            </View>
          </View>
        ) : decoration === "single-square" ? (
          <View style={[styles.singleSquare, { borderColor: decorationColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        ) : (
          <Text style={styles.scoreCellText}>{displayValue}</Text>
        )}

        {/* Junk dot indicator */}
        {hasJunkDot && <View style={styles.junkDot} />}
      </View>
    </View>
  );
}

function getScoreDecoration(
  scoreToPar: number,
):
  | "double-circle"
  | "single-circle"
  | "double-square"
  | "single-square"
  | null {
  if (scoreToPar <= -2) return "double-circle"; // Eagle or better
  if (scoreToPar === -1) return "single-circle"; // Birdie
  if (scoreToPar === 0) return null; // Par
  if (scoreToPar === 1) return "single-square"; // Bogey
  if (scoreToPar >= 2) return "double-square"; // Double bogey or worse
  return null;
}

function getDecorationColor(
  scoreToPar: number,
  theme: ReturnType<typeof useUnistyles>["theme"],
): string {
  if (scoreToPar <= -2) return theme.colors.score.eagle;
  if (scoreToPar === -1) return theme.colors.score.birdie;
  if (scoreToPar === 1) return theme.colors.score.bogey;
  if (scoreToPar >= 2) return theme.colors.score.doubleBogey;
  return theme.colors.primary;
}

export function GameLeaderboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("gross");

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
      holes: { $each: true },
    },
  });

  const scoreResult = useScoreboard(game);
  const scoreboard = scoreResult?.scoreboard ?? null;

  if (!game) {
    return null;
  }

  const playerColumns = getPlayerColumns(game);
  const holeRows = getHoleRows(game);

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
            { label: "gross", onPress: () => setViewMode("gross") },
            { label: "net", onPress: () => setViewMode("net") },
            { label: "points", onPress: () => setViewMode("points") },
          ]}
          selectedIndex={viewMode === "gross" ? 0 : viewMode === "net" ? 1 : 2}
        />
      </View>

      {/* Leaderboard Table */}
      <ScrollView style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row - Player Names (vertical text) */}
            <View style={styles.headerRow}>
              <View style={styles.holeColumn}>
                <Text style={styles.headerLabel}>Hole</Text>
              </View>
              {playerColumns.map((player) => (
                <View key={player.playerId} style={styles.playerColumn}>
                  <View style={styles.verticalTextContainer}>
                    <Text style={styles.verticalText}>{player.firstName}</Text>
                    <Text style={styles.verticalText}>{player.lastName}</Text>
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
                  const value = row.isSummaryRow
                    ? getSummaryValue(
                        scoreboard,
                        player.playerId,
                        row.summaryType!,
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

                  const junkDot =
                    !row.isSummaryRow &&
                    hasJunk(scoreboard, player.playerId, row.hole);

                  return (
                    <View key={player.playerId} style={styles.playerColumn}>
                      <ScoreCell
                        value={value}
                        scoreToPar={scoreToPar}
                        hasJunkDot={junkDot}
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
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  tableContainer: {
    flex: 1,
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
  headerRow: {
    flexDirection: "row",
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dataRow: {
    flexDirection: "row",
    minHeight: 36,
    alignItems: "center",
  },
  summaryRow: {
    backgroundColor: theme.colors.border,
  },
  holeColumn: {
    width: 50,
    paddingLeft: theme.gap(1),
    justifyContent: "center",
  },
  playerColumn: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  verticalTextContainer: {
    alignItems: "center",
    height: 60,
    justifyContent: "flex-end",
  },
  verticalText: {
    fontSize: 11,
    color: theme.colors.primary,
    transform: [{ rotate: "-60deg" }],
    width: 60,
    textAlign: "left",
  },
  holeText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  summaryText: {
    fontWeight: "bold",
  },
  scoreCell: {
    minWidth: 50,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCellContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  scoreCellText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  // Circle decorations (birdie/eagle)
  outerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  singleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Square decorations (bogey/double)
  outerSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  innerSquare: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  singleSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // Junk dot
  junkDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.primary,
    marginLeft: 1,
    marginTop: -10,
  },
}));
