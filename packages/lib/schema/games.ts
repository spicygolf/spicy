import { co, z } from "jazz-tools";
import { ListOfGameHoles } from "./gameholes";
import { GameSpec } from "./gamespecs";
import { MapOfOptions } from "./options";
import { ListOfPlayers } from "./players";
import { ListOfRoundToGames } from "./rounds";
import { ListOfPayoutPools } from "./settlement";
import { TeamsConfig } from "./teamsconfig";

export const GameScope = co.map({
  /**
   * Which holes are being played in this game.
   * "all18" - full 18 holes
   * "front9" - holes 1-9
   * "back9" - holes 10-18
   */
  holes: z.literal(["all18", "front9", "back9"]),

  /**
   * Team configuration for this game.
   * If present, the game uses teams. Check rotateEvery to determine
   * whether teams are set in settings (0) or during play (>0).
   */
  teamsConfig: co.optional(TeamsConfig),
});
export type GameScope = co.loaded<typeof GameScope>;

export const Game = co.map({
  start: z.date(),
  name: z.string(),
  scope: GameScope,

  /**
   * Working copy of the spec's options for this game.
   * Created by copying from the catalog spec (specRef) at game creation.
   * User modifications to game options go here directly.
   * This is what scoring and display code should read from.
   */
  spec: co.optional(MapOfOptions),

  /**
   * Reference to the original catalog spec.
   * Used for:
   * - "Reset to defaults" - copy specRef options back to spec
   * - "Show diff" - compare spec vs specRef to see what changed
   * - Display original spec name/description
   * Do NOT read options from here for scoring - use spec instead.
   */
  specRef: co.optional(GameSpec),

  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,

  /**
   * Timestamp when the user dismissed the stale-handicap check for this game.
   * Suppresses the modal until a player's handicap revDate becomes newer than
   * this timestamp (indicating fresh data arrived after the dismiss).
   */
  handicapCheckDismissedAt: z.date().optional(),

  /**
   * Account ID of the game organizer (creator).
   * Only the organizer can modify game settings.
   * If absent (legacy games), all players can edit settings.
   */
  organizer: z.string().optional(),

  /**
   * Payout pool configuration for settlement.
   * Each pool defines how a portion of the pot is distributed.
   * If absent, settlement uses a single 100% winner-take-all pool.
   */
  payoutPools: co.optional(ListOfPayoutPools),

  /**
   * Legacy ID from ArangoDB v0.3 import (_key field).
   * Used for idempotent imports and tracking migrated games.
   */
  legacyId: z.string().optional(),
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
