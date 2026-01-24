/**
 * Ranking Stage
 *
 * Ranks players and teams based on their scores.
 * Uses the RankingEngine for proper tie handling.
 */

import { deepClone } from "../../utils/clone";
import { getSpecField } from "../option-utils";
import { rankWithTies } from "../ranking-engine";
import type { ScoringContext } from "../types";

/**
 * Rank players on each hole by net score
 *
 * Lower net score = better rank (golf scoring).
 * Ties are handled with proper golf ranking (1st, 1st, 3rd).
 *
 * @param ctx - Scoring context with net scores calculated
 * @returns Updated context with player rankings
 */
export function rankPlayers(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Get players with valid scores
    const playersWithScores = Object.entries(holeResult.players)
      .filter(([_, p]) => p.net > 0)
      .map(([playerId, p]) => ({ playerId, net: p.net }));

    if (playersWithScores.length === 0) continue;

    // Rank by net score (lower is better)
    const ranked = rankWithTies(playersWithScores, (p) => p.net, "lower");

    // Update player results with rankings
    for (const { item, rank, tieCount } of ranked) {
      const playerResult = holeResult.players[item.playerId];
      if (playerResult) {
        playerResult.rank = rank;
        playerResult.tieCount = tieCount;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}

/**
 * Rank teams on each hole by team score
 *
 * Lower team score = better rank (golf scoring).
 * The team score interpretation depends on the game type.
 *
 * @param ctx - Scoring context with team scores calculated
 * @returns Updated context with team rankings
 */
export function rankTeams(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Get teams with valid scores
    const teamsWithScores = Object.entries(holeResult.teams)
      .filter(([_, t]) => t.score > 0)
      .map(([teamId, t]) => ({ teamId, score: t.score }));

    if (teamsWithScores.length === 0) continue;

    // Rank by team score (lower is better)
    const ranked = rankWithTies(teamsWithScores, (t) => t.score, "lower");

    // Update team results with rankings
    for (const { item, rank, tieCount } of ranked) {
      const teamResult = holeResult.teams[item.teamId];
      if (teamResult) {
        teamResult.rank = rank;
        teamResult.tieCount = tieCount;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}

/**
 * Rank players cumulatively across all holes
 *
 * @param ctx - Scoring context with hole results
 * @returns Updated context with cumulative player rankings
 */
export function rankPlayersCumulative(ctx: ScoringContext): ScoringContext {
  const { scoreboard } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  // Get players with cumulative scores
  const playersWithTotals = Object.entries(newScoreboard.cumulative.players)
    .filter(([_, p]) => p.netTotal > 0)
    .map(([playerId, p]) => ({ playerId, netTotal: p.netTotal }));

  if (playersWithTotals.length === 0) {
    return { ...ctx, scoreboard: newScoreboard };
  }

  // Rank by net total (lower is better)
  const ranked = rankWithTies(playersWithTotals, (p) => p.netTotal, "lower");

  // Update cumulative results with rankings
  for (const { item, rank, tieCount } of ranked) {
    const playerCumulative = newScoreboard.cumulative.players[item.playerId];
    if (playerCumulative) {
      playerCumulative.rank = rank;
      playerCumulative.tieCount = tieCount;
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}

/**
 * Rank teams cumulatively across all holes
 *
 * NOTE: This function is NOT used in the main pipeline.
 * The cumulative ranking is done inside calculateCumulatives() in cumulative.ts.
 * This function exists for standalone use cases.
 *
 * For points games (most games), higher points = better rank.
 * The ranking metric and direction depend on game type:
 * - Points games: rank by pointsTotal, higher is better
 * - Stroke games: rank by scoreTotal, lower is better
 *
 * @param ctx - Scoring context with hole results
 * @returns Updated context with cumulative team rankings
 */
export function rankTeamsCumulative(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameSpec } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  // Determine ranking metric and direction based on game type
  // Points games: higher points = better
  // Skins games: higher points = better (winning skins)
  // The spec_type field indicates the game scoring mechanism
  const specType = getSpecField(gameSpec, "spec_type");
  const isPointsGame = specType === "points" || specType === "skins";

  // Get teams with cumulative totals
  const teamsWithTotals = Object.entries(newScoreboard.cumulative.teams)
    .filter(([_, t]) => (isPointsGame ? t.pointsTotal !== 0 : t.scoreTotal > 0))
    .map(([teamId, t]) => ({
      teamId,
      value: isPointsGame ? t.pointsTotal : t.scoreTotal,
    }));

  if (teamsWithTotals.length === 0) {
    return { ...ctx, scoreboard: newScoreboard };
  }

  // Rank by the appropriate metric
  // Points/match/skins: higher is better
  // Stroke play: lower is better
  const direction = isPointsGame ? "higher" : "lower";
  const ranked = rankWithTies(teamsWithTotals, (t) => t.value, direction);

  // Update cumulative results with rankings
  for (const { item, rank, tieCount } of ranked) {
    const teamCumulative = newScoreboard.cumulative.teams[item.teamId];
    if (teamCumulative) {
      teamCumulative.rank = rank;
      teamCumulative.tieCount = tieCount;
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
