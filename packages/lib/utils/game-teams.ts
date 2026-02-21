import type { MaybeLoaded } from "jazz-tools";
import type {
  Game,
  GameHole,
  ListOfGameHoles,
  RoundToGame,
} from "spicylib/schema";
import {
  GameHole as GameHoleClass,
  ListOfRoundToTeams,
  ListOfTeams,
  RoundToTeam,
  Team,
} from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";

import { computeSpecForcesTeams } from "./teams";

/**
 * Ensures that holes exist for the game based on game.scope.holes configuration.
 * Creates holes if they don't exist.
 * Returns true if holes were created or already exist, false if game data is invalid.
 */
export function ensureGameHoles(game: Game): boolean {
  if (!game?.$isLoaded || !game.holes?.$isLoaded) {
    return false;
  }

  // If holes already exist, we're good
  if (game.holes.length > 0) {
    return true;
  }

  // Determine which holes to create based on scope
  const scopeHoles = game.scope?.$isLoaded ? game.scope.holes : "all18";
  let holeNumbers: number[] = [];

  if (scopeHoles === "front9") {
    holeNumbers = Array.from({ length: 9 }, (_, i) => i + 1);
  } else if (scopeHoles === "back9") {
    holeNumbers = Array.from({ length: 9 }, (_, i) => i + 10);
  } else {
    // Default to all18
    holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);
  }

  // Create holes
  for (const holeNum of holeNumbers) {
    const gameHole = GameHoleClass.create(
      {
        hole: holeNum.toString(),
        seq: holeNum,
        teams: ListOfTeams.create([], { owner: game.$jazz.owner }),
      },
      { owner: game.$jazz.owner },
    );
    game.holes.$jazz.push(gameHole);
  }

  return true;
}

/**
 * Deep clones teams from one hole to another, creating new Jazz objects.
 * The roundToGame references are intentionally shared (not cloned) since they
 * point to the same player's round data.
 */
export function cloneTeamsToHole(sourceHole: GameHole, targetHole: GameHole) {
  const sourceTeams = sourceHole.teams;
  if (!sourceTeams?.$isLoaded || sourceTeams.length === 0) {
    return;
  }

  const newTeams = ListOfTeams.create([], { owner: targetHole.$jazz.owner });

  for (const sourceTeam of sourceTeams) {
    if (!sourceTeam?.$isLoaded || !sourceTeam.rounds?.$isLoaded) continue;

    const roundToTeams = ListOfRoundToTeams.create([], {
      owner: targetHole.$jazz.owner,
    });

    for (const sourceRoundToTeam of sourceTeam.rounds) {
      if (
        !sourceRoundToTeam?.$isLoaded ||
        !sourceRoundToTeam.roundToGame?.$isLoaded
      )
        continue;

      const roundToTeam = RoundToTeam.create(
        { roundToGame: sourceRoundToTeam.roundToGame },
        { owner: targetHole.$jazz.owner },
      );
      roundToTeams.$jazz.push(roundToTeam);
    }

    const team = Team.create(
      {
        team: sourceTeam.team,
        rounds: roundToTeams,
      },
      { owner: targetHole.$jazz.owner },
    );
    newTeams.$jazz.push(team);
  }

  targetHole.$jazz.set("teams", newTeams);
}

/**
 * Ensures a hole has teams assigned. For rotateEvery=0, copies from hole 1 if needed.
 * Returns true if teams were loaded/copied, false if teams need to be chosen.
 */
export function ensureHoleHasTeams(
  _game: Game,
  holes: MaybeLoaded<ListOfGameHoles> | undefined,
  holeIndex: number,
  rotateEvery: number,
): boolean {
  if (!holes?.$isLoaded || holes.length === 0) {
    return false;
  }

  const hole = holes[holeIndex];
  if (!hole?.$isLoaded) {
    return false;
  }

  // If hole already has teams, we're good
  if (hole.teams?.$isLoaded && hole.teams.length > 0) {
    return true;
  }

  // If rotateEvery === 0, teams are fixed - copy from hole 1
  if (rotateEvery === 0 && holeIndex > 0) {
    const firstHole = holes[0];
    if (!firstHole?.$isLoaded) {
      return false;
    }

    if (!firstHole.teams?.$isLoaded || firstHole.teams.length === 0) {
      return false;
    }

    // Clone teams from hole 1 to this hole
    cloneTeamsToHole(firstHole, hole);
    return true;
  }

  // Teams need to be chosen (either hole 1 initially, or rotating teams)
  return false;
}

/**
 * Determines if the team chooser should be shown for the current hole.
 * Requires game parameter to check if all players are assigned.
 */
export function shouldShowTeamChooser(
  holes: MaybeLoaded<ListOfGameHoles> | undefined,
  currentHoleIndex: number,
  rotateEvery: number | undefined,
  game?: Game,
): boolean {
  if (!holes?.$isLoaded || holes.length === 0 || rotateEvery === undefined) {
    return false;
  }

  const currentHole = holes[currentHoleIndex];
  if (!currentHole?.$isLoaded) {
    return false;
  }

  // Don't show chooser while teams are still loading
  if (!currentHole.teams?.$isLoaded) {
    return false;
  }

  // If hole has no teams (empty list), we need the chooser
  if (currentHole.teams.length === 0) {
    return true;
  }

  // Ensure all teams in the list are fully loaded before making a decision
  for (const team of currentHole.teams) {
    if (!team?.$isLoaded || !team.rounds?.$isLoaded) {
      // Still loading, don't show chooser yet
      return false;
    }
  }

  // Count how many players are assigned to teams on this hole
  let allPlayersAssigned = false;
  if (game?.rounds?.$isLoaded) {
    const totalPlayers = game.rounds.length;
    let assignedPlayers = 0;

    for (const team of currentHole.teams) {
      if (!team?.$isLoaded || !team.rounds?.$isLoaded) continue;
      assignedPlayers += team.rounds.length;
    }

    allPlayersAssigned = assignedPlayers >= totalPlayers;

    // If not all players are assigned, show the chooser
    if (!allPlayersAssigned) {
      return true;
    }
  }

  // If we're at a rotation boundary (and not hole 0), show chooser
  // BUT only if teams aren't already fully assigned
  if (
    rotateEvery > 0 &&
    currentHoleIndex > 0 &&
    currentHoleIndex % rotateEvery === 0 &&
    !allPlayersAssigned
  ) {
    return true;
  }

  return false;
}

/**
 * Gets team assignments from a specific hole for the TeamChooser component.
 */
export function getTeamAssignmentsFromHole(
  hole: GameHole | undefined,
): Map<string, number> {
  const assignments = new Map<string, number>();

  if (!hole?.$isLoaded || !hole.teams?.$isLoaded) {
    return assignments;
  }

  for (const team of hole.teams) {
    if (!team?.$isLoaded || !team.rounds?.$isLoaded) continue;

    const teamNumber = Number.parseInt(team.team, 10);
    if (Number.isNaN(teamNumber)) continue;

    for (const roundToTeam of team.rounds) {
      if (!roundToTeam?.$isLoaded || !roundToTeam.roundToGame?.$isLoaded)
        continue;
      assignments.set(roundToTeam.roundToGame.$jazz.id, teamNumber);
    }
  }

  return assignments;
}

/**
 * Saves team assignments to holes based on rotation settings.
 *
 * - rotateEvery === 0: Save to ALL holes (fixed teams for whole game)
 * - rotateEvery > 0: Save to current rotation period only
 *
 * @param game - The game with holes and rounds loaded
 * @param assignments - Map of roundToGame ID -> team number
 * @param teamCount - Number of teams
 * @param currentHoleIndex - Current hole index (used for rotation period calculation)
 * @param rotateEvery - Rotation frequency (0 = never rotate)
 */
export function saveTeamAssignmentsToAllRelevantHoles(
  game: Game,
  assignments: Map<string, number>,
  teamCount: number,
  currentHoleIndex: number,
  rotateEvery: number,
): void {
  if (!game?.holes?.$isLoaded || !game.rounds?.$isLoaded) {
    return;
  }

  const totalHoles = game.holes.length;

  if (rotateEvery > 0) {
    // Rotating teams: save to current rotation period only
    const rotationPeriodStart =
      Math.floor(currentHoleIndex / rotateEvery) * rotateEvery;
    const rotationPeriodEnd = Math.min(
      rotationPeriodStart + rotateEvery,
      totalHoles,
    );

    for (let i = rotationPeriodStart; i < rotationPeriodEnd; i++) {
      saveTeamAssignmentsToHole(game, game.holes, i, assignments, teamCount);
    }
  } else {
    // No rotation (rotateEvery === 0): save to ALL holes
    for (let i = 0; i < totalHoles; i++) {
      saveTeamAssignmentsToHole(game, game.holes, i, assignments, teamCount);
    }
  }
}

/**
 * Saves team assignments to a specific hole.
 */
export function saveTeamAssignmentsToHole(
  game: Game,
  holes: MaybeLoaded<ListOfGameHoles> | undefined,
  holeIndex: number,
  assignments: Map<string, number>,
  teamCount: number,
) {
  if (!holes?.$isLoaded || holes.length === 0 || !game?.rounds?.$isLoaded) {
    return;
  }

  const hole = holes[holeIndex];
  if (!hole?.$isLoaded) {
    return;
  }

  // Get all player rounds
  const allPlayerRounds = [];
  for (const roundToGame of game.rounds) {
    if (!roundToGame?.$isLoaded) continue;
    allPlayerRounds.push(roundToGame);
  }

  // Create new teams list
  const newTeams = ListOfTeams.create([], { owner: hole.$jazz.owner });

  for (let i = 1; i <= teamCount; i++) {
    const teamPlayers = allPlayerRounds.filter(
      (rtg) => assignments.get(rtg.$jazz.id) === i,
    );

    if (teamPlayers.length === 0) continue;

    const roundToTeams = ListOfRoundToTeams.create([], {
      owner: hole.$jazz.owner,
    });

    for (const player of teamPlayers) {
      const roundToTeam = RoundToTeam.create(
        { roundToGame: player },
        { owner: hole.$jazz.owner },
      );
      roundToTeams.$jazz.push(roundToTeam);
    }

    const team = Team.create(
      {
        team: `${i}`,
        rounds: roundToTeams,
      },
      { owner: hole.$jazz.owner },
    );

    newTeams.$jazz.push(team);
  }

  hole.$jazz.set("teams", newTeams);
}

/**
 * Auto-assigns a single player to their own team (for seamless mode).
 * Creates a new team with the given team number on all holes.
 *
 * This is used when adding a player in seamless mode where each player
 * gets their own team (1:1 assignment).
 *
 * @param game - The game (must have holes loaded)
 * @param roundToGame - The player's RoundToGame reference
 * @param teamNumber - The team number to assign (typically playerIndex + 1)
 */
export function autoAssignPlayerToTeam(
  game: Game,
  roundToGame: RoundToGame,
  teamNumber: number,
): boolean {
  if (!game?.$isLoaded || !game.holes?.$isLoaded) {
    return false;
  }

  if (!roundToGame?.$isLoaded) {
    return false;
  }

  // Ensure holes exist
  ensureGameHoles(game);

  // Add player to their team on each hole
  for (const hole of game.holes) {
    if (!hole?.$isLoaded) continue;

    // Initialize teams list if needed
    if (!hole.teams?.$isLoaded) {
      hole.$jazz.set(
        "teams",
        ListOfTeams.create([], { owner: hole.$jazz.owner }),
      );
    }

    // Check if this team already exists on this hole
    let existingTeam: Team | null = null;
    if (hole.teams?.$isLoaded) {
      for (const team of hole.teams) {
        if (team?.$isLoaded && team.team === `${teamNumber}`) {
          existingTeam = team;
          break;
        }
      }
    }

    if (existingTeam) {
      // Add player to existing team
      if (!existingTeam.rounds?.$isLoaded) {
        existingTeam.$jazz.set(
          "rounds",
          ListOfRoundToTeams.create([], { owner: hole.$jazz.owner }),
        );
      }
      const roundToTeam = RoundToTeam.create(
        { roundToGame },
        { owner: hole.$jazz.owner },
      );
      if (existingTeam.rounds?.$isLoaded) {
        existingTeam.rounds.$jazz.push(roundToTeam);
      }
    } else {
      // Create new team for this player
      const roundToTeams = ListOfRoundToTeams.create([], {
        owner: hole.$jazz.owner,
      });
      const roundToTeam = RoundToTeam.create(
        { roundToGame },
        { owner: hole.$jazz.owner },
      );
      roundToTeams.$jazz.push(roundToTeam);

      const team = Team.create(
        {
          team: `${teamNumber}`,
          rounds: roundToTeams,
        },
        { owner: hole.$jazz.owner },
      );

      if (hole.teams?.$isLoaded) {
        hole.teams.$jazz.push(team);
      }
    }
  }

  return true;
}

/**
 * Clears all team assignments from all holes in a game.
 * Used when reverting to seamless mode or resetting teams.
 */
export function clearAllTeamAssignments(game: Game): boolean {
  if (!game?.$isLoaded || !game.holes?.$isLoaded) {
    return false;
  }

  for (const hole of game.holes) {
    if (!hole?.$isLoaded) continue;

    // Create empty teams list
    hole.$jazz.set(
      "teams",
      ListOfTeams.create([], { owner: hole.$jazz.owner }),
    );
  }

  return true;
}

/**
 * Re-assigns all players in seamless mode (1:1 player to team).
 * Used when reverting to seamless mode after players are removed.
 */
export function reassignAllPlayersSeamless(game: Game): boolean {
  if (!game?.$isLoaded || !game.holes?.$isLoaded || !game.rounds?.$isLoaded) {
    return false;
  }

  // First clear all assignments
  clearAllTeamAssignments(game);

  // Ensure holes exist
  ensureGameHoles(game);

  // Assign each player to their own team (1-indexed)
  let teamNumber = 1;
  for (const roundToGame of game.rounds) {
    if (!roundToGame?.$isLoaded) continue;

    autoAssignPlayerToTeam(game, roundToGame, teamNumber);
    teamNumber++;
  }

  return true;
}

/**
 * Computes whether the game is in seamless mode (individual play).
 * In seamless mode, each player gets their own team (1:1 assignment).
 *
 * This is the non-hook version for use in utility functions.
 * For React components, use useTeamsMode() hook instead.
 *
 * Returns false if required data is not yet loaded (scope, spec, players).
 */
export function computeIsSeamlessMode(game: Game): boolean {
  // Wait for all required data to be loaded before making a decision
  if (
    !game?.$isLoaded ||
    !game.scope?.$isLoaded ||
    !game.spec?.$isLoaded ||
    !game.players?.$isLoaded
  ) {
    return false;
  }

  // Check if spec forces teams
  const spec = game.spec;
  if (computeSpecForcesTeams(spec)) {
    return false;
  }

  // Check if user has manually activated teams
  if (
    game.scope.teamsConfig?.$isLoaded &&
    game.scope.teamsConfig.active === true
  ) {
    return false;
  }

  // Check if over player threshold (teams mode auto-activates)
  const minPlayers = (getSpecField(spec, "min_players") as number) ?? 2;
  const playerCount = game.players.length;
  if (playerCount > minPlayers) {
    return false;
  }

  return true; // Seamless mode
}

/**
 * Finds the next available team number for seamless mode.
 * Looks at existing team assignments on hole 1 and returns the lowest
 * unused positive integer.
 *
 * If team data is not fully loaded, returns a safe fallback (players.length + 1)
 * to guarantee uniqueness and avoid duplicate team numbers.
 */
export function getNextAvailableTeamNumber(game: Game): number {
  // Safe fallback: players.length + 1 is guaranteed unique
  const safeFallback = (game.players?.$isLoaded ? game.players.length : 0) + 1;

  if (!game?.holes?.$isLoaded || game.holes.length === 0) {
    return safeFallback;
  }

  const firstHole = game.holes[0];
  if (!firstHole?.$isLoaded || !firstHole.teams?.$isLoaded) {
    return safeFallback;
  }

  // Collect all existing team numbers
  // If any team isn't loaded, bail out to avoid returning a duplicate
  const existingTeamNumbers = new Set<number>();
  for (const team of firstHole.teams) {
    if (!team?.$isLoaded) {
      // Team not loaded - can't guarantee uniqueness, use safe fallback
      return safeFallback;
    }
    const num = Number.parseInt(team.team, 10);
    if (!Number.isNaN(num)) {
      existingTeamNumbers.add(num);
    }
  }

  // Find the lowest unused positive integer
  let nextNumber = 1;
  while (existingTeamNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return nextNumber;
}

/**
 * Checks if all players in the game have team assignments on hole 1.
 */
function allPlayersHaveTeamAssignments(game: Game): boolean {
  if (!game.holes?.$isLoaded || game.holes.length === 0) {
    return false;
  }

  const firstHole = game.holes[0];
  if (!firstHole?.$isLoaded || !firstHole.teams?.$isLoaded) {
    return false;
  }

  if (firstHole.teams.length === 0) {
    return false;
  }

  // Count assigned players
  let assignedCount = 0;
  for (const team of firstHole.teams) {
    if (!team?.$isLoaded || !team.rounds?.$isLoaded) continue;
    assignedCount += team.rounds.length;
  }

  const totalPlayers = game.rounds?.$isLoaded ? game.rounds.length : 0;
  return assignedCount >= totalPlayers && totalPlayers > 0;
}

/**
 * Ensures all players have 1:1 team assignments in seamless (individual) mode.
 *
 * This is idempotent - safe to call multiple times:
 * - If game is in teams mode (user toggle, spec forces, or over threshold): no-op
 * - If all players already have teams: no-op
 * - Otherwise: assigns each player to their own team
 *
 * @param game - The game (must have holes, rounds, scope, spec resolved)
 * @returns true if teams were ensured (either already existed or were created)
 */
export function ensureSeamlessTeamAssignments(game: Game): boolean {
  if (!game?.$isLoaded || !game.holes?.$isLoaded || !game.rounds?.$isLoaded) {
    return false;
  }

  // Check if we're in seamless mode (individual play)
  const isSeamlessMode = computeIsSeamlessMode(game);
  if (!isSeamlessMode) {
    return false; // Teams mode - don't auto-assign
  }

  // Check if teams already exist and all players are assigned
  if (allPlayersHaveTeamAssignments(game)) {
    return true; // Already assigned
  }

  // Assign all players 1:1
  return reassignAllPlayersSeamless(game);
}
