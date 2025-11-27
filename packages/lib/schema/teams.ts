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
});
export type Team = co.loaded<typeof Team>;

export const ListOfTeams = co.list(Team);
export type ListOfTeams = co.loaded<typeof ListOfTeams>;
