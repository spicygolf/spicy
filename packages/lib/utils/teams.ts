/**
 * Team calculation utilities.
 *
 * These functions handle team count calculation with a clear priority:
 * 1. num_teams - Fixed number of teams (e.g., Five Points always has 2 teams)
 * 2. team_size calculation - Derive team count from min_players / team_size
 * 3. Fallback - Use provided fallback value (typically player count or min_players)
 */

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
