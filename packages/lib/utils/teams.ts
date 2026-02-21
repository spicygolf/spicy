/**
 * Team calculation utilities.
 *
 * These functions handle team count calculation with a clear priority:
 * 1. num_teams - Fixed number of teams (e.g., Five Points always has 2 teams)
 * 2. team_size calculation - Derive team count from min_players / team_size
 * 3. Fallback - Use provided fallback value (typically player count or min_players)
 */

import type { GameSpec } from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";

export interface TeamCountParams {
  /** Fixed number of teams (highest priority) */
  numTeams?: number;
  /** Suggested team size for calculation */
  teamSize?: number;
  /** Minimum players for team_size calculation */
  minPlayers?: number;
  /** Fallback value when no other calculation applies */
  fallback: number;
}

/**
 * Calculate the number of teams based on spec configuration.
 *
 * Priority:
 * 1. num_teams > 0 - Use explicit team count (e.g., Five Points = 2 teams)
 * 2. team_size > 0 with min_players - Calculate ceil(min_players / team_size)
 * 3. fallback - Use provided fallback (typically player count)
 *
 * @example
 * // Five Points: always 2 teams regardless of player count
 * calculateTeamCount({ numTeams: 2, fallback: 4 }) // => 2
 *
 * @example
 * // Vegas: team_size=2, min_players=4 => 2 teams
 * calculateTeamCount({ teamSize: 2, minPlayers: 4, fallback: 4 }) // => 2
 *
 * @example
 * // No team config: fall back to player count
 * calculateTeamCount({ fallback: 3 }) // => 3
 */
export function calculateTeamCount(params: TeamCountParams): number {
  const { numTeams, teamSize, minPlayers, fallback } = params;

  // Priority 1: Explicit num_teams
  if (numTeams && numTeams > 0) {
    return numTeams;
  }

  // Priority 2: Calculate from team_size and min_players
  if (teamSize && teamSize > 0 && minPlayers && minPlayers > 0) {
    return Math.ceil(minPlayers / teamSize);
  }

  // Priority 3: Fallback
  return fallback;
}

/**
 * Determines whether a spec forces teams mode based on its options.
 *
 * A spec forces teams when:
 * - team_change_every > 0 (rotating teams like Wolf)
 * - teams is true (spec explicitly requires teams)
 * - team_size > 1 (team size constraint like Vegas)
 * - num_teams > 1 (fixed team count like Five Points)
 */
export function computeSpecForcesTeams(spec: GameSpec): boolean {
  if (!spec?.$isLoaded) return false;

  const teamChangeEvery =
    (getSpecField(spec, "team_change_every") as number) ?? 0;
  const teams = (getSpecField(spec, "teams") as boolean) ?? false;
  const teamSize = (getSpecField(spec, "team_size") as number) ?? 0;
  const numTeams = (getSpecField(spec, "num_teams") as number) ?? 0;

  return teamChangeEvery > 0 || teams || teamSize > 1 || numTeams > 1;
}

/**
 * Determines whether a spec explicitly disables teams (teams: false).
 *
 * When true, the auto-threshold (playerCount > minPlayers) should NOT
 * activate teams mode — the spec is declaring this is an individual game
 * regardless of player count (e.g., The Big Game with 48 players).
 */
export function computeSpecDisablesTeams(spec: GameSpec): boolean {
  if (!spec?.$isLoaded) return false;

  const teams = getSpecField(spec, "teams");
  return teams === false;
}

/**
 * Returns the num_teams value from a spec if it's set and positive.
 * Used to determine if team count is fixed (e.g., Five Points = 2 teams).
 *
 * @param spec - The game spec to check
 * @returns The num_teams value if set and > 0, otherwise undefined
 */
export function getSpecNumTeams(spec: GameSpec): number | undefined {
  if (!spec?.$isLoaded) return undefined;
  const numTeams = (getSpecField(spec, "num_teams") as number) ?? 0;
  return numTeams > 0 ? numTeams : undefined;
}
