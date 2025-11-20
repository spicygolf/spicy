import { co, z } from "jazz-tools";

/**
 * Configuration for team settings in a game.
 */
export const TeamsConfig = co.map({
  /**
   * How often teams rotate/change during the game (in holes).
   * 0 - teams never rotate (set once in game settings)
   * 1 - teams change every hole
   * 3 - teams change every 3 holes
   * 6 - teams change every 6 holes
   * 9 - teams change every 9 holes
   */
  rotateEvery: z.number(),

  /**
   * Number of teams for this game.
   * When rotateEvery = 0, teams are assigned in game settings.
   * When rotateEvery > 0, teams are assigned dynamically during play.
   */
  teamCount: z.number(),

  /**
   * Maximum number of players allowed per team (optional constraint).
   * If not set, teams can have any number of players.
   */
  maxPlayersPerTeam: z.optional(z.number()),

  /**
   * Order of player IDs for determining team lead rotation (e.g., Wolf, Captain).
   * Used by games that rotate a special role among players.
   */
  teamLeadOrder: z.optional(z.array(z.string())),
});
export type TeamsConfig = co.loaded<typeof TeamsConfig>;
