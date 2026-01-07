import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
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
 */
function formatWithSign(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

/**
 * Calculate total course par from the first player's tee data
 */
function getCoursePar(game: Game): number {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) {
    return 72; // Default par
  }

  const firstRtg = game.rounds[0];
  if (!firstRtg?.$isLoaded) return 72;

  const round = firstRtg.round;
  if (!round?.$isLoaded || !round.$jazz.has("tee")) return 72;

  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return 72;

  let totalPar = 0;
  for (const hole of tee.holes) {
    if (hole?.$isLoaded && hole.par) {
      totalPar += hole.par;
    }
  }

  return totalPar || 72;
}

/**
 * Build player summary data from scoreboard and game
 */
function buildPlayerSummaries(
  game: Game,
  scoreboard: Scoreboard | null,
  coursePar: number,
): PlayerSummary[] {
  if (!scoreboard || !game.players?.$isLoaded) {
    return [];
  }

  const summaries: PlayerSummary[] = [];

  for (const player of game.players) {
    if (!player?.$isLoaded) continue;

    const playerId = player.$jazz.id;
    const cumulative = scoreboard.cumulative.players[playerId];

    if (!cumulative) continue;

    summaries.push({
      playerId,
      name: player.name,
      gross: cumulative.grossTotal,
      toPar: cumulative.grossTotal - coursePar,
      points: cumulative.pointsTotal,
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
  const coursePar = getCoursePar(game);
  const playerSummaries = buildPlayerSummaries(game, scoreboard, coursePar);

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
                    {formatWithSign(player.toPar)}
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
