/**
 * Scoring Pipeline
 *
 * Main entry point for the data-driven scoring engine.
 * Orchestrates all pipeline stages to calculate a complete scoreboard.
 *
 * IMPORTANT: This pipeline is completely data-driven.
 * NO game-specific code - all game rules come from GameSpec and Option data.
 */

import type {
  Game,
  GameHole,
  GameSpec,
  MapOfOptions,
  RoundToGame,
  Team,
} from "../schema";
import {
  assignTeams,
  calculateCumulatives,
  calculateGrossScores,
  calculateNetScores,
  calculatePoints,
  calculatePops,
  calculateTeamScores,
  evaluateJunk,
  evaluateMultipliers,
  initializeScoreboard,
  rankPlayers,
  rankTeams,
} from "./stages";
import type {
  HoleInfo,
  PlayerHandicapInfo,
  Scoreboard,
  ScoringContext,
  ScoringStage,
} from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Score a game and return the complete scoreboard
 *
 * This is the main entry point for the scoring engine.
 * It builds a context from the game data and runs all pipeline stages.
 *
 * The pipeline is completely data-driven:
 * - Points come from junk option values
 * - Team scoring methods come from junk option calculation fields
 * - Multiplier triggers come from multiplier option based_on fields
 *
 * @param game - The game to score (must be fully loaded)
 * @returns Complete scoreboard with all results
 */
export function score(game: Game): Scoreboard {
  const ctx = buildContext(game);
  const final = runPipeline(ctx);
  return final.scoreboard;
}

/**
 * Build the initial scoring context from a game
 *
 * Extracts and pre-computes all needed data from the Jazz game object.
 * This ensures all data is loaded upfront to avoid async issues in stages.
 */
export function buildContext(game: Game): ScoringContext {
  // Extract game spec (first one)
  const gameSpec = extractGameSpec(game);

  // Extract options (game options or fall back to spec options)
  const options = extractOptions(game, gameSpec);

  // Extract holes in play order
  const gameHoles = extractHoles(game);

  // Extract rounds
  const rounds = extractRounds(game);

  // Build player handicaps lookup
  const playerHandicaps = buildPlayerHandicaps(rounds);

  // Build hole info lookup
  const holeInfoMap = buildHoleInfo(rounds, gameHoles);

  // Build teams per hole lookup
  const teamsPerHole = buildTeamsPerHole(gameHoles);

  // Build player to team mapping per hole
  const playerTeamMap = buildPlayerTeamMap(gameHoles);

  // Create empty scoreboard (will be populated by stages)
  const scoreboard: Scoreboard = {
    holes: {},
    cumulative: {
      players: {},
      teams: {},
    },
    meta: {
      gameId: game.$jazz.id ?? "unknown",
      holesPlayed: [],
      hasTeams:
        teamsPerHole.size > 0 &&
        [...teamsPerHole.values()].some((t) => t.length > 0),
      pointsPerHole: 0, // Will be calculated from junk options
    },
  };

  return {
    game,
    gameSpec,
    options,
    gameHoles,
    rounds,
    playerInfoMap: new Map(), // Will be populated as needed
    holeInfoMap,
    playerHandicaps,
    teamsPerHole,
    playerTeamMap,
    scoreboard,
  };
}

// =============================================================================
// Pipeline Execution
// =============================================================================

/**
 * Run the scoring pipeline
 *
 * Executes all stages in order. The pipeline is the same for all games -
 * game-specific behavior comes from the data in options.
 */
function runPipeline(ctx: ScoringContext): ScoringContext {
  // All stages run in a fixed order
  // Game-specific logic comes from the option data, not from different stages
  const stages: ScoringStage[] = [
    // Phase 1: Initialize structure
    initializeScoreboard,

    // Phase 2: Calculate scores
    calculateGrossScores,
    calculatePops,
    calculateNetScores,

    // Phase 3: Team setup and scoring
    assignTeams,
    calculateTeamScores,

    // Phase 4: Rankings
    rankPlayers,
    rankTeams,

    // Phase 5: Junk and multipliers (data-driven)
    evaluateJunk,
    evaluateMultipliers,

    // Phase 6: Points calculation
    calculatePoints,

    // Phase 7: Cumulatives
    calculateCumulatives,
  ];

  // Run all stages
  return stages.reduce((c, stage) => stage(c), ctx);
}

// =============================================================================
// Context Building Helpers
// =============================================================================

function extractGameSpec(game: Game): GameSpec {
  if (!game.specs?.$isLoaded || game.specs.length === 0) {
    throw new Error("Game must have at least one game spec");
  }

  const spec = game.specs[0];
  if (!spec?.$isLoaded) {
    throw new Error("Game spec must be loaded");
  }

  return spec;
}

function extractOptions(game: Game, gameSpec: GameSpec): MapOfOptions {
  // Prefer game-level options (customized), fall back to spec options
  if (game.options?.$isLoaded) {
    return game.options;
  }

  if (gameSpec.options?.$isLoaded) {
    return gameSpec.options;
  }

  // Return empty options object
  return {} as MapOfOptions;
}

function extractHoles(game: Game): GameHole[] {
  if (!game.holes?.$isLoaded) {
    return [];
  }

  const holes: GameHole[] = [];
  for (const hole of game.holes) {
    if (hole?.$isLoaded) {
      holes.push(hole);
    }
  }

  // Sort by sequence number
  return holes.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

function extractRounds(game: Game): RoundToGame[] {
  if (!game.rounds?.$isLoaded) {
    return [];
  }

  const rounds: RoundToGame[] = [];
  for (const rtg of game.rounds) {
    if (rtg?.$isLoaded) {
      rounds.push(rtg);
    }
  }

  return rounds;
}

function buildPlayerHandicaps(
  rounds: RoundToGame[],
): Map<string, PlayerHandicapInfo> {
  const handicaps = new Map<string, PlayerHandicapInfo>();

  for (const rtg of rounds) {
    if (!rtg?.$isLoaded) continue;

    const round = rtg.round;
    if (!round?.$isLoaded) continue;

    const playerId = round.playerId;
    if (!playerId) continue;

    const courseHandicap = rtg.courseHandicap ?? 0;
    const gameHandicap = rtg.gameHandicap;
    const effectiveHandicap = gameHandicap ?? courseHandicap;

    handicaps.set(playerId, {
      playerId,
      roundToGameId: playerId, // Use playerId as identifier since RoundToGame doesn't have id
      effectiveHandicap,
      courseHandicap,
      gameHandicap,
    });
  }

  return handicaps;
}

function buildHoleInfo(
  rounds: RoundToGame[],
  holes: GameHole[],
): Map<string, HoleInfo> {
  const holeInfoMap = new Map<string, HoleInfo>();

  // Get tee data from first round (all players should have same course/tee)
  const firstRound = rounds.find((rtg) => {
    if (!rtg?.$isLoaded) return false;
    const round = rtg.round;
    if (!round?.$isLoaded) return false;
    const tee = round.tee;
    return tee?.$isLoaded;
  });

  if (!firstRound) {
    // Create default hole info
    for (const gameHole of holes) {
      holeInfoMap.set(gameHole.hole, {
        hole: gameHole.hole,
        par: 4, // Default par
        allocation: Number.parseInt(gameHole.hole, 10), // Use hole number as default
        yards: 0,
      });
    }
    return holeInfoMap;
  }

  // We know round is loaded from the find predicate above
  const round = firstRound.round;
  if (!round?.$isLoaded) {
    return holeInfoMap;
  }

  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) {
    return holeInfoMap;
  }

  for (const gameHole of holes) {
    const holeNum = gameHole.hole;
    const holeIndex = Number.parseInt(holeNum, 10) - 1; // Convert to 0-indexed
    const teeHole = tee.holes[holeIndex];

    if (teeHole?.$isLoaded) {
      holeInfoMap.set(holeNum, {
        hole: holeNum,
        par: teeHole.par ?? 4,
        allocation: teeHole.handicap ?? holeIndex + 1,
        yards: teeHole.yards ?? 0,
      });
    } else {
      // Fallback for missing tee hole data
      holeInfoMap.set(holeNum, {
        hole: holeNum,
        par: 4,
        allocation: holeIndex + 1,
        yards: 0,
      });
    }
  }

  return holeInfoMap;
}

function buildTeamsPerHole(holes: GameHole[]): Map<string, Team[]> {
  const teamsPerHole = new Map<string, Team[]>();

  for (const gameHole of holes) {
    const holeNum = gameHole.hole;

    if (!gameHole.teams?.$isLoaded) {
      teamsPerHole.set(holeNum, []);
      continue;
    }

    const teams: Team[] = [];
    for (const team of gameHole.teams) {
      if (team?.$isLoaded) {
        teams.push(team);
      }
    }

    teamsPerHole.set(holeNum, teams);
  }

  return teamsPerHole;
}

function buildPlayerTeamMap(
  holes: GameHole[],
): Map<string, Map<string, string>> {
  const playerTeamMap = new Map<string, Map<string, string>>();

  for (const gameHole of holes) {
    const holeNum = gameHole.hole;
    const holePlayerTeam = new Map<string, string>();

    if (gameHole.teams?.$isLoaded) {
      for (const team of gameHole.teams) {
        if (!team?.$isLoaded || !team.team) continue;

        if (team.rounds?.$isLoaded) {
          for (const rtt of team.rounds) {
            if (!rtt?.$isLoaded) continue;
            const rtg = rtt.roundToGame;
            if (!rtg?.$isLoaded) continue;
            const round = rtg.round;
            if (!round?.$isLoaded) continue;
            const playerId = round.playerId;
            if (playerId) {
              holePlayerTeam.set(playerId, team.team);
            }
          }
        }
      }
    }

    playerTeamMap.set(holeNum, holePlayerTeam);
  }

  return playerTeamMap;
}
