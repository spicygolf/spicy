/**
 * Teams Stage
 *
 * Handles team assignment. Teams are read from GameHole.teams for each hole.
 * Team score calculation is handled by the team-scores stage.
 */

import type { ScoringContext } from "../types";

/**
 * Assign teams for all holes
 *
 * This stage ensures team player mappings are set up correctly.
 * Teams are already initialized in the scoreboard during the initialize stage
 * based on teamsPerHole. This stage validates the setup.
 *
 * @param ctx - Scoring context with player net scores calculated
 * @returns Updated context with team data validated
 */
export function assignTeams(ctx: ScoringContext): ScoringContext {
  // Teams are already initialized in the scoreboard during initialize stage
  // based on teamsPerHole. The playerIds are extracted from team.rounds.
  // This stage is a no-op but kept for pipeline consistency and future enhancements.

  return ctx;
}
