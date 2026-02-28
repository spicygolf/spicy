import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { Payout, Scoreboard } from "spicylib/scoring";
import { getGrossPayoutsByPlayer, getTeamRunningScore } from "spicylib/scoring";
import { HoleHeader } from "@/components/game/scoring";
import { Button, Text } from "@/ui";

export interface SummaryViewProps {
  game: Game;
  scoreboard: Scoreboard | null;
  totalHoles: number;
  onPrevHole: () => void;
  onNextHole: () => void;
  payouts?: Payout[] | null;
}

interface PlayerSummary {
  playerId: string;
  name: string;
  gross: number;
  toPar: number;
  points: number;
  holesPlayed: number;
  payout: number | null;
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
  payouts?: Payout[] | null,
): PlayerSummary[] {
  if (!scoreboard || !game.players?.$isLoaded) {
    return [];
  }

  const hasPayouts = payouts != null && payouts.length > 0;
  const grossByPlayer = hasPayouts
    ? getGrossPayoutsByPlayer(payouts)
    : new Map<string, number>();

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

    const grossPayout = grossByPlayer.get(playerId) ?? 0;

    summaries.push({
      playerId,
      name: player.name,
      gross: cumulative.grossTotal,
      toPar: cumulative.grossTotal - parForPlayer,
      points,
      holesPlayed: cumulative.holesPlayed,
      payout: grossPayout > 0 ? grossPayout : null,
    });
  }

  // Sort by payout (descending) when available, otherwise by gross (ascending)
  if (hasPayouts) {
    summaries.sort((a, b) => (b.payout ?? 0) - (a.payout ?? 0));
  } else {
    summaries.sort((a, b) => a.gross - b.gross);
  }

  return summaries;
}

/**
 * Format a gross payout amount: "$120", "$0"
 */
function formatPayout(value: number): string {
  return `$${value}`;
}

/** Convert a numeric rank to ordinal: 1→"1st", 2→"2nd", 3→"3rd", 4→"4th" */
function toOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/**
 * Build a winnings summary string for a player.
 * e.g. "Front: 1st, Back: T2, Total: 1st" or "Back: T1, Skins: 1"
 */
function buildWinningsSummary(
  payouts: Payout[],
  playerId: string,
): string | null {
  const playerPayouts = payouts.filter(
    (p) => p.playerId === playerId && p.amount > 0,
  );
  if (playerPayouts.length === 0) return null;

  return playerPayouts
    .map((p) => {
      // per_unit pools (skins): show count
      if (p.rankLabel === "") {
        return `${p.poolDisp}: ${p.metricValue}`;
      }
      // Tie rank (e.g. "T2"): use as-is
      if (p.rankLabel.startsWith("T")) {
        return `${p.poolDisp}: ${p.rankLabel}`;
      }
      // Solo rank: convert to ordinal
      return `${p.poolDisp}: ${toOrdinal(Number(p.rankLabel))}`;
    })
    .join(", ");
}

export function SummaryView({
  game,
  scoreboard,
  totalHoles,
  onPrevHole,
  onNextHole,
  payouts,
}: SummaryViewProps) {
  const playerSummaries = buildPlayerSummaries(game, scoreboard, payouts);
  const hasPayout = payouts != null && payouts.length > 0;

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
          <View style={[styles.row, styles.headerRow]}>
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
            {hasPayout && (
              <View style={styles.numberColumn}>
                <Text style={styles.headerText}>$</Text>
              </View>
            )}
          </View>

          {/* Player Rows */}
          {playerSummaries.map((player) => {
            const thru =
              player.holesPlayed < totalHoles
                ? `thru ${player.holesPlayed}`
                : "";
            const winnings = hasPayout
              ? buildWinningsSummary(payouts, player.playerId)
              : null;

            return (
              <View key={player.playerId} style={styles.playerBlock}>
                <View style={styles.row}>
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
                  {hasPayout && (
                    <View style={styles.numberColumn}>
                      {player.payout != null ? (
                        <Text
                          style={[
                            styles.scoreText,
                            player.payout > 0 && styles.payoutPositive,
                          ]}
                        >
                          {formatPayout(player.payout)}
                        </Text>
                      ) : (
                        <Text style={styles.scoreText}>-</Text>
                      )}
                    </View>
                  )}
                </View>
                {winnings ? (
                  <Text style={styles.winningsText} numberOfLines={1}>
                    {winnings}
                  </Text>
                ) : null}
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
  playerBlock: {
    paddingVertical: theme.gap(1),
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
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
  winningsText: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 16,
  },
  payoutPositive: {
    color: theme.colors.action,
  },
  buttonContainer: {
    marginTop: theme.gap(4),
  },
}));
