import type { MaybeLoaded } from "jazz-tools";
import type { Game, GameHole, ListOfGameHoles } from "spicylib/schema";
import {
  ListOfRoundToTeams,
  ListOfTeams,
  RoundToTeam,
  Team,
} from "spicylib/schema";

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
 */
export function shouldShowTeamChooser(
  holes: MaybeLoaded<ListOfGameHoles> | undefined,
  currentHoleIndex: number,
  rotateEvery: number | undefined,
): boolean {
  if (!holes?.$isLoaded || holes.length === 0 || rotateEvery === undefined) {
    return false;
  }

  const currentHole = holes[currentHoleIndex];
  if (!currentHole?.$isLoaded) {
    return false;
  }

  // If hole has no teams, we need the chooser
  if (!currentHole.teams?.$isLoaded || currentHole.teams.length === 0) {
    return true;
  }

  // If we're at a rotation boundary (and not hole 0), show chooser
  if (
    rotateEvery > 0 &&
    currentHoleIndex > 0 &&
    currentHoleIndex % rotateEvery === 0
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
