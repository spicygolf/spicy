import { co, z } from "jazz-tools";
import { ListOfBets } from "./bets";
import { ListOfGameHoles } from "./gameholes";
import { GameSpec } from "./gamespecs";
import { MapOfOptions } from "./options";
import { ListOfPlayers } from "./players";
import { ListOfRoundToGames } from "./rounds";

import { TeamsConfig } from "./teamsconfig";

/**
 * A group of players within a multi-group game (e.g., a foursome).
 * Groups are for score-entry logistics (filtering which players you see),
 * not for competition pairing (that's the teams system).
 */
export const GameGroup = co.map({
  /** Display name, e.g., "Group 1", "Group 2" */
  name: z.string(),
  /** Optional tee time for this group, e.g., "7:30 AM" */
  teeTime: z.string().optional(),
  /** Players assigned to this group (references to RoundToGame edges) */
  rounds: ListOfRoundToGames,
});
export type GameGroup = co.loaded<typeof GameGroup>;

export const ListOfGameGroups = co.list(GameGroup);
export type ListOfGameGroups = co.loaded<typeof ListOfGameGroups>;

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

  /**
   * Player groups for multi-group games (e.g., foursomes in a 48-player tournament).
   * Used for score-entry filtering — not for competition pairing (that's teams).
   */
  groups: co.optional(ListOfGameGroups),
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
   *
   * Stored as a string (not co.ref) to avoid loading overhead —
   * this is compared against the current user's ID on every render.
   */
  organizer: z.string().optional(),

  /**
   * Scored sub-competitions within this game (e.g., front/back/overall/skins).
   * Each bet has a scope (which holes), scoring type, and payout config.
   * If absent, the game has an implicit single bet: all18, points, per_unit.
   */
  bets: co.optional(ListOfBets),

  /**
   * Tombstone flag set before deep-delete begins.
   * When true, scoring and fingerprinting bail out immediately,
   * preventing re-score storms as nested data is cleared.
   */
  deleted: z.literal(true).optional(),

  /**
   * Legacy ID from ArangoDB v0.3 import (_key field).
   * Used for idempotent imports and tracking migrated games.
   */
  legacyId: z.string().optional(),
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
