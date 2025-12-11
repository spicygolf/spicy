import { co, z } from "jazz-tools";
import { RoundToGame } from "./rounds";

/**
 * Graph edge between rounds and teams. Links a player's round to a team.
 * This allows accessing both the round data (scores) and game handicaps
 * through the RoundToGame edge.
 */
export const RoundToTeam = co.map({
  /**
   * Reference to the RoundToGame edge, which contains:
   * - round: The actual Round with scores
   * - handicapIndex: Player's handicap index for this game
   * - courseHandicap: Calculated course handicap
   * - gameHandicap: Adjusted game handicap (if overridden)
   */
  roundToGame: RoundToGame,
});
export type RoundToTeam = co.loaded<typeof RoundToTeam>;

export const ListOfRoundToTeams = co.list(RoundToTeam);
export type ListOfRoundToTeams = co.loaded<typeof ListOfRoundToTeams>;

/**
 * TeamOption - Option/junk attributed to a team or specific player
 * Used for tracking junk (birdie, prox, etc.) and multipliers per team
 */
export const TeamOption = co.map({
  /**
   * Name of the option (e.g., "prox", "birdie", "double")
   */
  optionName: z.string(),

  /**
   * Value of the option (e.g., "true", "2")
   */
  value: z.string(),

  /**
   * Player ID who earned this option (optional).
   * Used for junk attribution (e.g., which player got the birdie)
   */
  playerId: z.string().optional(),
});
export type TeamOption = co.loaded<typeof TeamOption>;

export const ListOfTeamOptions = co.list(TeamOption);
export type ListOfTeamOptions = co.loaded<typeof ListOfTeamOptions>;

export const Team = co.map({
  /**
   * Team identifier/name (e.g., "1", "2", "Team A", "Team B")
   */
  team: z.string(),

  /**
   * List of rounds (via RoundToGame edges) that are on this team.
   * Access pattern for scoring:
   *   team.rounds[i].roundToGame.round.scores[String(holeIndex)]
   *   team.rounds[i].roundToGame.courseHandicap
   */
  rounds: ListOfRoundToTeams,

  /**
   * Options/junk for this team.
   * Used for tracking junk (birdie, prox, etc.) and multipliers.
   * Can be attributed to specific players via playerId.
   */
  options: co.optional(ListOfTeamOptions),
});
export type Team = co.loaded<typeof Team>;

export const ListOfTeams = co.list(Team);
export type ListOfTeams = co.loaded<typeof ListOfTeams>;
