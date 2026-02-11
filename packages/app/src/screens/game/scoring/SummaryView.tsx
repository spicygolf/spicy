import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
import { getTeamRunningScore } from "spicylib/scoring";
import { HoleHeader } from "@/components/game/scoring";
import { Button, Text } from "@/ui";

export interface SummaryViewProps {
  game: Game;
  scoreboard: Scoreboard | null;
  totalHoles: number;
  onPrevHole: () => void;
  onNextHole: () => void;
}

interface PlayerSummary {
  playerId: string;
  name: string;
  gross: number;
  toPar: number;
  points: number;
  holesPlayed: number;
}

/**
 * Format a number with +/- prefix for display
 * For "To Par", uses golf convention: "E" for even par
 */
function formatWithSign(value: number, useEvenPar = false): string {
  if (value > 0) {
    return `+${value}`;
  }
  if (value === 0 && useEvenPar) {
    return "E";
  }
  return String(value);
}

/**
 * Calculate par for only the holes where a specific player has scored.
 * Each player may have scored a different number of holes.
 */
function getParForPlayer(
  scoreboard: Scoreboard | null,
  playerId: string,
): number {
  if (!scoreboard) return 0;

  let totalPar = 0;

  for (const holeResult of Object.values(scoreboard.holes)) {
    const playerResult = holeResult.players[playerId];
    if (playerResult?.hasScore) {
      totalPar += holeResult.holeInfo.par;
    }
  }

  return totalPar;
}

/**
 * Get the final team points for each player from the last hole's running score.
 * For 2-team games, returns runningDiff (net vs opponent).
 * For individual/multi-team games, returns runningTotal (cumulative points).
 */
function getPlayerTeamPoints(scoreboard: Scoreboard): Map<string, number> {
  const playerPoints = new Map<string, number>();
  const holesPlayed = scoreboard.meta.holesPlayed;

  if (holesPlayed.length === 0) {
    return playerPoints;
  }

  const lastHoleNum = holesPlayed[holesPlayed.length - 1];
  const lastHole = scoreboard.holes[lastHoleNum];

  if (!lastHole) {
    return playerPoints;
  }

  for (const teamResult of Object.values(lastHole.teams)) {
    const teamPoints = getTeamRunningScore(teamResult);
    for (const playerId of teamResult.playerIds) {
      playerPoints.set(playerId, teamPoints);
    }
  }

  return playerPoints;
}

/**
 * Build player summary data from scoreboard and game
 */
function buildPlayerSummaries(
  game: Game,
  scoreboard: Scoreboard | null,
): PlayerSummary[] {
  if (!scoreboard || !game.players?.$isLoaded) {
    return [];
  }

  // Get team-based points for each player (from last hole's runningDiff)
  const teamPoints = getPlayerTeamPoints(scoreboard);

  const summaries: PlayerSummary[] = [];

  for (const player of game.players) {
    if (!player?.$isLoaded) continue;

    const playerId = player.$jazz.id;
    const cumulative = scoreboard.cumulative.players[playerId];

    if (!cumulative) continue;

    // Use team points if available (2-team games), otherwise fall back to player points
    const points = teamPoints.get(playerId) ?? cumulative.pointsTotal;

    // Calculate par for only the holes THIS player has scored
    const parForPlayer = getParForPlayer(scoreboard, playerId);

    summaries.push({
      playerId,
      name: player.name,
      gross: cumulative.grossTotal,
      toPar: cumulative.grossTotal - parForPlayer,
      points,
      holesPlayed: cumulative.holesPlayed,
    });
  }

  // Sort by gross score (ascending - lowest score first)
  summaries.sort((a, b) => a.gross - b.gross);

  return summaries;
}

export function SummaryView({
  game,
  scoreboard,
  totalHoles,
  onPrevHole,
  onNextHole,
}: SummaryViewProps) {
  const playerSummaries = buildPlayerSummaries(game, scoreboard);

  return (
    <>
      <HoleHeader
        hole={{ number: "Summary" }}
        onPrevious={onPrevHole}
        onNext={onNextHole}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Header Row */}
          <View style={styles.row}>
            <View style={styles.playerColumn}>
              <Text style={styles.headerText}>Player</Text>
            </View>
            <View style={styles.numberColumn}>
              <Text style={styles.headerText}>Gross</Text>
            </View>
            <View style={styles.numberColumn}>
              <Text style={styles.headerText}>To Par</Text>
            </View>
            <View style={styles.numberColumn}>
              <Text style={styles.headerText}>Points</Text>
            </View>
          </View>

          {/* Player Rows */}
          {playerSummaries.map((player) => {
            const thru =
              player.holesPlayed < totalHoles
                ? `thru ${player.holesPlayed}`
                : "";

            return (
              <View key={player.playerId} style={styles.row}>
                <View style={styles.playerColumn}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                  {thru ? <Text style={styles.thruText}>{thru}</Text> : null}
                </View>
                <View style={styles.numberColumn}>
                  <Text style={styles.scoreText}>{player.gross}</Text>
                </View>
                <View style={styles.numberColumn}>
                  <Text style={styles.scoreText}>
                    {formatWithSign(player.toPar, true)}
                  </Text>
                </View>
                <View style={styles.numberColumn}>
                  <Text style={styles.scoreText}>
                    {formatWithSign(player.points)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Handicap Posting Button */}
          <View style={styles.buttonContainer}>
            <Button
              label="Review and post to handicap service"
              onPress={() => {
                // TODO: Navigate to handicap posting screen
              }}
              disabled={true}
            />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
    padding: theme.gap(2),
  },
  card: {
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: theme.gap(1),
  },
  playerColumn: {
    flex: 3,
    justifyContent: "center",
  },
  numberColumn: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: theme.gap(1),
  },
  headerText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  playerName: {
    fontSize: 16,
  },
  thruText: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  scoreText: {
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: theme.gap(4),
  },
}));
