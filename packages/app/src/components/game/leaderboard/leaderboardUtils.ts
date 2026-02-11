import type { Game } from "spicylib/schema";
import type { Scoreboard } from "spicylib/scoring";
import { getTeamHolePoints, isHoleComplete } from "spicylib/scoring";

export type ViewMode = "gross" | "net" | "points";

export interface PlayerColumn {
  playerId: string;
  firstName: string;
  lastName: string;
}

export interface HoleData {
  hole: string;
  par: number;
  isSummaryRow: boolean;
  summaryType?: "out" | "in" | "total";
}

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
 * Get team points for a player on a hole.
 * For 2-team games returns holeNetTotal (net vs opponent).
 * For individual/multi-team games returns absolute points.
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

  return getTeamHolePoints(teamResult);
}

/**
 * Get player columns from game data
 */
export function getPlayerColumns(game: Game): PlayerColumn[] {
  if (!game.players?.$isLoaded) return [];

  const columns: PlayerColumn[] = [];
  for (const player of game.players) {
    if (!player?.$isLoaded) continue;

    const nameParts = (player.name || "").trim().split(/\s+/);
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
export function getHoleRows(game: Game): HoleData[] {
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
export function getScoreValue(
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

  // Return null if no score has been entered for this hole
  if (!playerResult.hasScore) return null;

  switch (viewMode) {
    case "gross":
      return playerResult.gross;
    case "net":
      return playerResult.net;
    case "points":
      // Don't show points for incomplete holes
      if (!isHoleComplete(scoreboard.holes[hole])) return null;
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
export function getSummaryValue(
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
        // Skip incomplete holes
        if (!isHoleComplete(scoreboard.holes[hole])) continue;
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
  let hasAnyScore = false;
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
        hasAnyScore = true;
      }
    }
  }

  return hasAnyScore ? total : null;
}

/**
 * Get number of pops (handicap strokes) for a player on a hole
 * Returns 0, 1, 2, or 3 depending on handicap differential
 */
export function getPopsCount(
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
export function getScoreToPar(
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
