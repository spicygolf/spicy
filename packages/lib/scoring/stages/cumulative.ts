/**
 * Cumulative Stage
 *
 * Calculates cumulative totals for players and teams across all holes.
 */

import { rankWithTies } from "../ranking-engine";
import type { ScoringContext } from "../types";

/**
 * Calculate cumulative totals for all players and teams
 *
 * This stage aggregates hole-by-hole results into cumulative totals
 * and calculates final rankings.
 *
 * @param ctx - Scoring context with all hole results calculated
 * @returns Updated context with cumulative totals
 */
export function calculateCumulatives(ctx: ScoringContext): ScoringContext {
  const { scoreboard } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  // Calculate player cumulatives
  for (const playerCumulative of Object.values(
    newScoreboard.cumulative.players,
  )) {
    let grossTotal = 0;
    let popsTotal = 0;
    let netTotal = 0;
    let pointsTotal = 0;
    let junkTotal = 0;
    let holesPlayed = 0;

    for (const holeResult of Object.values(newScoreboard.holes)) {
      const playerResult = holeResult.players[playerCumulative.playerId];
      if (playerResult && playerResult.gross > 0) {
        grossTotal += playerResult.gross;
        popsTotal += playerResult.pops;
        netTotal += playerResult.net;
        pointsTotal += playerResult.points;
        junkTotal += playerResult.junk.reduce((sum, j) => sum + j.value, 0);
        holesPlayed++;
      }
    }

    playerCumulative.grossTotal = grossTotal;
    playerCumulative.popsTotal = popsTotal;
    playerCumulative.netTotal = netTotal;
    playerCumulative.pointsTotal = pointsTotal;
    playerCumulative.junkTotal = junkTotal;
    playerCumulative.holesPlayed = holesPlayed;
  }

  // Calculate team cumulatives
  for (const teamCumulative of Object.values(newScoreboard.cumulative.teams)) {
    let scoreTotal = 0;
    let pointsTotal = 0;
    let junkTotal = 0;

    for (const holeResult of Object.values(newScoreboard.holes)) {
      const teamResult = holeResult.teams[teamCumulative.teamId];
      if (teamResult) {
        scoreTotal += teamResult.score;
        pointsTotal += teamResult.points;
        junkTotal += teamResult.junk.reduce((sum, j) => sum + j.value, 0);
      }
    }

    teamCumulative.scoreTotal = scoreTotal;
    teamCumulative.pointsTotal = pointsTotal;
    teamCumulative.junkTotal = junkTotal;
  }

  // Rank players by net total (lower is better for golf)
  const playersWithTotals = Object.entries(newScoreboard.cumulative.players)
    .filter(([_, p]) => p.holesPlayed > 0)
    .map(([playerId, p]) => ({ playerId, netTotal: p.netTotal }));

  if (playersWithTotals.length > 0) {
    const rankedPlayers = rankWithTies(
      playersWithTotals,
      (p) => p.netTotal,
      "lower",
    );
    for (const { item, rank, tieCount } of rankedPlayers) {
      const playerCumulative = newScoreboard.cumulative.players[item.playerId];
      if (playerCumulative) {
        playerCumulative.rank = rank;
        playerCumulative.tieCount = tieCount;
      }
    }
  }

  // Rank teams by points total (higher is better for points games)
  const teamsWithTotals = Object.entries(newScoreboard.cumulative.teams)
    .filter(([_, t]) => t.pointsTotal > 0)
    .map(([teamId, t]) => ({ teamId, pointsTotal: t.pointsTotal }));

  if (teamsWithTotals.length > 0) {
    const rankedTeams = rankWithTies(
      teamsWithTotals,
      (t) => t.pointsTotal,
      "higher",
    );
    for (const { item, rank, tieCount } of rankedTeams) {
      const teamCumulative = newScoreboard.cumulative.teams[item.teamId];
      if (teamCumulative) {
        teamCumulative.rank = rank;
        teamCumulative.tieCount = tieCount;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
