import { useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
import { useGame } from "@/hooks";
import { useScoreboard } from "@/hooks/useScoreboard";
import { ButtonGroup, Screen, Text } from "@/ui";

type ViewMode = "gross" | "net" | "points";

/**
 * Find which team a player belongs to on a given hole
 */
function findPlayerTeam(
  scoreboard: Scoreboard,
  playerId: string,
  hole: string,
): string | null {
  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  for (const [teamId, teamResult] of Object.entries(holeResult.teams)) {
    if (teamResult.playerIds.includes(playerId)) {
      return teamId;
    }
  }
  return null;
}

/**
 * Get team points for a player on a hole (for 2-team games like Five Points)
 * Returns the team's holeNetTotal which is the +/- vs opponent
 */
function getTeamPointsForPlayer(
  scoreboard: Scoreboard,
  playerId: string,
  hole: string,
): number | null {
  const teamId = findPlayerTeam(scoreboard, playerId, hole);
  if (!teamId) return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return null;

  // holeNetTotal is the +/- points vs opponent for this hole
  return teamResult.holeNetTotal ?? teamResult.points;
}

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
      // For team games, show the team's hole net total (vs opponent)
      // Fall back to individual player points if no team data
      return (
        getTeamPointsForPlayer(scoreboard, playerId, hole) ??
        playerResult.points
      );
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

  // For points, calculate from team hole net totals
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
        // Use team points (same as getScoreValue for points mode)
        const teamPoints = getTeamPointsForPlayer(scoreboard, playerId, hole);
        if (teamPoints !== null) {
          total += teamPoints;
        } else {
          // Fall back to individual player points
          const playerResult = scoreboard.holes[hole]?.players[playerId];
          if (playerResult) {
            total += playerResult.points;
          }
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
 * Get number of pops (handicap strokes) for a player on a hole
 * Returns 0, 1, 2, or 3 depending on handicap differential
 */
function getPopsCount(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
): number {
  if (!scoreboard) return 0;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return 0;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return 0;

  return playerResult.pops;
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
  popsCount,
  isSummaryRow,
  viewMode,
}: {
  value: number | null;
  scoreToPar: number | null;
  popsCount: number;
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

  // Use primary color for decoration borders (matches screenshots)
  const borderColor = theme.colors.primary;

  // Render pops dots (1, 2, or 3 strokes)
  const popsDots = [];
  for (let i = 0; i < Math.min(popsCount, 3); i++) {
    popsDots.push(
      <View key={i} style={[styles.popsDot, { top: 1 + i * 5 }]} />,
    );
  }

  return (
    <View style={styles.scoreCell}>
      {/* Pops dots - indicate handicap strokes on this hole */}
      {popsDots}

      {/* Score with decoration */}
      {decoration === "double-circle" ? (
        <View style={[styles.outerCircle, { borderColor }]}>
          <View style={[styles.innerCircle, { borderColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        </View>
      ) : decoration === "single-circle" ? (
        <View style={[styles.singleCircle, { borderColor }]}>
          <Text style={styles.scoreCellText}>{displayValue}</Text>
        </View>
      ) : decoration === "double-square" ? (
        <View style={[styles.outerSquare, { borderColor }]}>
          <View style={[styles.innerSquare, { borderColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        </View>
      ) : decoration === "single-square" ? (
        <View style={[styles.singleSquare, { borderColor }]}>
          <Text style={styles.scoreCellText}>{displayValue}</Text>
        </View>
      ) : (
        <Text style={styles.scoreCellText}>{displayValue}</Text>
      )}
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
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
  },
  toggleContainer: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(0.75),
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
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  verticalTextContainer: {
    alignItems: "flex-start",
    justifyContent: "flex-end",
    height: 58,
    width: 64,
    paddingBottom: 2,
  },
  verticalTextWrapper: {
    transform: [{ rotate: "-55deg" }],
    transformOrigin: "left bottom",
    width: 70,
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
  scoreCell: {
    width: 44,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scoreCellText: {
    fontSize: 13,
    color: theme.colors.primary,
  },
  // Circle decorations (birdie/eagle)
  outerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  singleCircle: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Square decorations (bogey/double) - not used in screenshots but keeping for completeness
  outerSquare: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerSquare: {
    width: 17,
    height: 17,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  singleSquare: {
    width: 19,
    height: 19,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Pops dot - indicates player receives handicap stroke on this hole
  // Multiple dots stack vertically (top is set dynamically: 1, 6, 11)
  popsDot: {
    position: "absolute",
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
}));
