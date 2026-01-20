/**
 * Initialize Stage
 *
 * Creates an empty scoreboard structure for a game.
 * This is the first stage in the scoring pipeline.
 */

import type {
  HoleInfo,
  HoleResult,
  PlayerCumulative,
  PlayerHoleResult,
  Scoreboard,
  ScoringContext,
  TeamCumulative,
  TeamHoleResult,
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
  const holesPlayed: string[] = [];

  // Initialize hole results
  for (const gameHole of ctx.gameHoles) {
    const holeNum = gameHole.hole;
    const holeInfo = ctx.holeInfoMap.get(holeNum);

    holes[holeNum] = createEmptyHoleResult(holeNum, holeInfo, ctx);
    holesPlayed.push(holeNum);
  }

  // Initialize player cumulatives from playerHandicaps (already extracted)
  for (const [playerId] of ctx.playerHandicaps) {
    playerCumulatives[playerId] = {
      playerId,
      grossTotal: 0,
      popsTotal: 0,
      netTotal: 0,
      pointsTotal: 0,
      junkTotal: 0,
      holesPlayed: 0,
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
      junkTotal: 0,
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
    meta: {
      gameId: ctx.game.$jazz.id ?? "unknown",
      holesPlayed,
      hasTeams: allTeamIds.size > 0,
      pointsPerHole: 0, // Calculated from junk options
    },
  };
}

/**
 * Create an empty hole result for a single hole
 */
function createEmptyHoleResult(
  holeNum: string,
  holeInfo: HoleInfo | undefined,
  ctx: ScoringContext,
): HoleResult {
  const players: Record<string, PlayerHoleResult> = {};
  const teams: Record<string, TeamHoleResult> = {};

  const defaultHoleInfo: HoleInfo = {
    hole: holeNum,
    par: holeInfo?.par ?? 4,
    allocation: holeInfo?.allocation ?? Number.parseInt(holeNum, 10),
    yards: holeInfo?.yards ?? 0,
  };

  // Initialize player results from playerHandicaps (already extracted)
  for (const [playerId] of ctx.playerHandicaps) {
    players[playerId] = {
      playerId,
      hasScore: false,
      gross: 0,
      pops: 0,
      net: 0,
      scoreToPar: 0,
      netToPar: 0,
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
      lowBall: 0,
      total: 0,
      playerIds,
      rank: 0,
      tieCount: 0,
      junk: [],
      multipliers: [],
      points: 0,
    };
  }

  return {
    hole: holeNum,
    holeInfo: defaultHoleInfo,
    players,
    teams,
  };
}
