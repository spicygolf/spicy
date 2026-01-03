/**
 * Cumulative Stage
 *
 * Calculates cumulative totals for players and teams across all holes.
 * Also calculates v0.3 parity fields:
 * - runningTotal: cumulative team points per hole
 * - runningDiff: difference from opponent (2-team games)
 * - holeNetTotal: net points vs opponent per hole (2-team games)
 */

import { getOptionValueForHole } from "../option-utils";
import { rankWithTies } from "../ranking-engine";
import type { ScoringContext, TeamHoleResult } from "../types";

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

  // Calculate running totals per hole for teams (v0.3 parity)
  calculateRunningTotals(newScoreboard, ctx);

  // Calculate match play status for 2-team match play games (v0.3 parity)
  calculateMatchPlay(newScoreboard, ctx);

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

// =============================================================================
// v0.3 Parity: Running Totals, Net Points, Match Play
// =============================================================================

/**
 * Calculate running totals for teams across all holes (v0.3 parity)
 *
 * For each hole:
 * - runningTotal: cumulative points up to and including this hole
 * - holeNetTotal: net points vs opponent (2-team games only)
 * - runningDiff: cumulative difference from opponent (2-team games only)
 *
 * Matches v0.3 score.js lines 280-340.
 */
function calculateRunningTotals(
  scoreboard: {
    holes: Record<string, { teams: Record<string, TeamHoleResult> }>;
    meta: { holesPlayed: string[] };
  },
  ctx: ScoringContext,
): void {
  const holes = scoreboard.meta.holesPlayed;
  const teamIds = Object.keys(Object.values(scoreboard.holes)[0]?.teams ?? {});
  const isTwoTeamGame = teamIds.length === 2;

  // Get betterPoints from game spec (determines if lower or higher points is better)
  // Default to "higher" for points games
  const betterPoints =
    (getOptionValueForHole("better_points", "1", ctx) as string) ?? "higher";
  const lowerIsBetter = betterPoints === "lower";

  // Track running totals per team
  const runningTotals: Record<string, number> = {};
  for (const teamId of teamIds) {
    runningTotals[teamId] = 0;
  }

  // Iterate through holes in order
  for (const holeNum of holes) {
    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const teams = Object.values(holeResult.teams);

    // Check if all scores are entered for this hole
    const allScoresEntered =
      teams.length > 0 &&
      teams.every((t) => t.playerIds.length > 0 && t.points !== undefined);

    // Calculate holeNetTotal for 2-team games
    if (isTwoTeamGame && teams.length === 2) {
      const team1 = teams[0];
      const team2 = teams[1];

      if (team1 && team2) {
        // holeNetTotal = my_points - opponent_points
        // Flip sign if lower points is better
        if (lowerIsBetter) {
          team1.holeNetTotal = team2.points - team1.points;
          team2.holeNetTotal = team1.points - team2.points;
        } else {
          team1.holeNetTotal = team1.points - team2.points;
          team2.holeNetTotal = team2.points - team1.points;
        }
      }
    }

    // Update running totals (only if all scores entered)
    for (const team of teams) {
      const prevTotal = runningTotals[team.teamId] ?? 0;

      if (allScoresEntered) {
        runningTotals[team.teamId] = prevTotal + team.points;
      }

      team.runningTotal = runningTotals[team.teamId];
    }

    // Calculate runningDiff for 2-team games
    if (isTwoTeamGame && teams.length === 2) {
      const team1 = teams[0];
      const team2 = teams[1];

      if (team1 && team2) {
        const diff1 =
          (runningTotals[team1.teamId] ?? 0) -
          (runningTotals[team2.teamId] ?? 0);
        const diff2 = -diff1;

        // Flip sign if lower points is better
        team1.runningDiff = lowerIsBetter ? -diff1 : diff1;
        team2.runningDiff = lowerIsBetter ? -diff2 : diff2;
      }
    }
  }
}

/**
 * Calculate match play status for 2-team games (v0.3 parity)
 *
 * Determines when a match is mathematically decided:
 * - matchDiff: holes up/down or final result like "3 & 2"
 * - matchOver: true when match is decided
 *
 * A match is over when one team's lead exceeds the remaining holes.
 * Matches v0.3 score.js lines 330-365.
 */
function calculateMatchPlay(
  scoreboard: {
    holes: Record<
      string,
      {
        teams: Record<string, TeamHoleResult>;
        scoresEntered?: number;
        players: Record<string, { gross: number }>;
      }
    >;
    meta: { holesPlayed: string[] };
    cumulative: {
      teams: Record<
        string,
        { matchDiff?: number | string; matchOver?: boolean }
      >;
    };
  },
  ctx: ScoringContext,
): void {
  // Check if this is a match play game
  // Match play is determined by spec_type or a game option
  const specType = ctx.gameSpec?.spec_type;
  const isMatchPlayOption = getOptionValueForHole("match_play", "1", ctx);
  const isMatchPlay = specType === "skins" || isMatchPlayOption === true;

  if (!isMatchPlay) return;

  const holes = scoreboard.meta.holesPlayed;
  const teamIds = Object.keys(Object.values(scoreboard.holes)[0]?.teams ?? {});

  if (teamIds.length !== 2) return;

  let isMatchOver = false;
  let matchResult: string | number = 0;
  let allHolesScoredSoFar = true;

  // Iterate through holes in order
  for (let i = 0; i < holes.length; i++) {
    const holeNum = holes[i];
    if (!holeNum) continue;

    const holeResult = scoreboard.holes[holeNum];
    if (!holeResult) continue;

    const teams = Object.values(holeResult.teams);
    if (teams.length !== 2) continue;

    const team1 = teams[0];
    const team2 = teams[1];
    if (!team1 || !team2) continue;

    // Check if all scores entered for this hole
    const totalPlayers = Object.keys(holeResult.players).length;
    const scoresEntered = holeResult.scoresEntered ?? 0;
    if (scoresEntered < totalPlayers) {
      allHolesScoredSoFar = false;
    }

    // If match is already over, propagate the result
    if (isMatchOver) {
      team1.matchDiff = matchResult;
      team2.matchDiff = matchResult;
      team1.matchOver = true;
      team2.matchOver = true;
      continue;
    }

    // Calculate current difference (using runningTotal which was already calculated)
    const diff = (team1.runningTotal ?? 0) - (team2.runningTotal ?? 0);
    const holesRemaining = holes.length - i - 1;

    // Check if match is decided
    if (Math.abs(diff) > holesRemaining && allHolesScoredSoFar) {
      isMatchOver = true;

      if (holesRemaining > 0) {
        matchResult = `${Math.abs(diff)} & ${holesRemaining}`;
      } else {
        matchResult = Math.abs(diff);
      }

      team1.matchOver = true;
      team2.matchOver = true;
      team1.matchDiff = matchResult;
      team2.matchDiff = matchResult;
    } else {
      // Match still in progress - show holes up/down
      team1.matchDiff = diff;
      team2.matchDiff = -diff;
    }
  }

  // Update cumulative with final match status
  for (const teamId of teamIds) {
    const teamCumulative = scoreboard.cumulative.teams[teamId];
    if (teamCumulative) {
      teamCumulative.matchOver = isMatchOver;
      teamCumulative.matchDiff = matchResult;
    }
  }
}
