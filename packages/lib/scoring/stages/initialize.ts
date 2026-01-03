/**
 * Initialize Stage
 *
 * Creates an empty scoreboard structure for a game.
 * This is the first stage in the scoring pipeline.
 */

import type {
  HoleResult,
  PlayerCumulative,
  Scoreboard,
  ScoringContext,
  TeamCumulative,
} from "../types";

/**
 * Create an empty scoreboard for the given context
 *
 * @param ctx - Scoring context with game data
 * @returns Updated context with initialized scoreboard
 */
export function initializeScoreboard(ctx: ScoringContext): ScoringContext {
  const scoreboard = createEmptyScoreboard(ctx);

  return {
    ...ctx,
    scoreboard,
  };
}

/**
 * Create an empty scoreboard structure based on holes and players
 */
function createEmptyScoreboard(ctx: ScoringContext): Scoreboard {
  const holes: Record<string, HoleResult> = {};
  const playerCumulatives: Record<string, PlayerCumulative> = {};
  const teamCumulatives: Record<string, TeamCumulative> = {};

  // Initialize hole results
  for (const gameHole of ctx.holes) {
    const holeNum = gameHole.hole;
    const holeInfo = ctx.holeInfo.get(holeNum);

    holes[holeNum] = createEmptyHoleResult(holeNum, holeInfo?.par ?? 0, ctx);
  }

  // Initialize player cumulatives from playerHandicaps (already extracted)
  for (const [playerId] of ctx.playerHandicaps) {
    playerCumulatives[playerId] = {
      playerId,
      grossTotal: 0,
      popsTotal: 0,
      netTotal: 0,
      pointsTotal: 0,
      rank: 0,
      tieCount: 0,
    };
  }

  // Initialize team cumulatives (if teams exist)
  const allTeamIds = new Set<string>();
  for (const teams of ctx.teamsPerHole.values()) {
    for (const team of teams) {
      if (team.team) {
        allTeamIds.add(team.team);
      }
    }
  }

  for (const teamId of allTeamIds) {
    teamCumulatives[teamId] = {
      teamId,
      scoreTotal: 0,
      pointsTotal: 0,
      rank: 0,
      tieCount: 0,
    };
  }

  return {
    holes,
    cumulative: {
      players: playerCumulatives,
      teams: teamCumulatives,
    },
  };
}

/**
 * Create an empty hole result for a single hole
 */
function createEmptyHoleResult(
  holeNum: string,
  par: number,
  ctx: ScoringContext,
): HoleResult {
  const players: Record<string, HoleResult["players"][string]> = {};
  const teams: Record<string, HoleResult["teams"][string]> = {};

  // Initialize player results from playerHandicaps (already extracted)
  for (const [playerId] of ctx.playerHandicaps) {
    players[playerId] = {
      playerId,
      gross: 0,
      pops: 0,
      net: 0,
      rank: 0,
      tieCount: 0,
      junk: [],
      multipliers: [],
      points: 0,
    };
  }

  // Initialize team results for this hole
  const holeTeams = ctx.teamsPerHole.get(holeNum) ?? [];
  for (const team of holeTeams) {
    if (!team.team) continue;

    const playerIds: string[] = [];
    if (team.rounds?.$isLoaded) {
      for (const rtt of team.rounds) {
        if (!rtt?.$isLoaded) continue;
        const rtg = rtt.roundToGame;
        if (!rtg?.$isLoaded) continue;
        const round = rtg.round;
        if (!round?.$isLoaded) continue;
        const playerId = round.playerId;
        if (playerId) {
          playerIds.push(playerId);
        }
      }
    }

    teams[team.team] = {
      teamId: team.team,
      score: 0,
      rank: 0,
      tieCount: 0,
      junk: [],
      multipliers: [],
      points: 0,
      playerIds,
    };
  }

  return {
    holeNum,
    par,
    players,
    teams,
  };
}
