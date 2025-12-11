import { co, z } from "jazz-tools";
import { Course, Tee } from "./courses";
import { MapOfScores } from "./scores";

/**
 * TeeHoleOverride - Override for a specific hole's tee data
 * Used when importing legacy games where tee data may differ from current GHIN data
 * Also used when players want to re-arrange pop holes or there's temporary construction
 * on the course
 */
export const TeeHoleOverride = co.map({
  hole: z.number(),
  par: z.number().optional(),
  yards: z.number().optional(),
  meters: z.number().optional(),
  handicap: z.number().optional(),
});
export type TeeHoleOverride = co.loaded<typeof TeeHoleOverride>;

export const ListOfTeeHoleOverrides = co.list(TeeHoleOverride);
export type ListOfTeeHoleOverrides = co.loaded<typeof ListOfTeeHoleOverrides>;

/**
 * TeeOverrides - Override tee data for a round
 * Used when importing legacy games to preserve historical tee configuration
 * that may differ from current GHIN data
 */
export const TeeOverrides = co.map({
  name: z.string().optional(),
  totalYardage: z.number().optional(),
  totalMeters: z.number().optional(),
  holes: co.optional(ListOfTeeHoleOverrides),
});
export type TeeOverrides = co.loaded<typeof TeeOverrides>;

export const Round = co.map({
  createdAt: z.date(),

  /**
   * The ID of the `Player` who played this round.
   */
  playerId: z.string(),

  /**
   *  A string representing the handicap index in decimal form.  Plus handicaps
   *  include the "+" sign, ex: "+1.5".  This is the player's index as of the
   *  date of the round, persisted here to maintain history and consistency of
   *  game scoring.  It may be overridden by the `RoundToGame` edge.
   */
  handicapIndex: z.string(),

  /**
   * The course where this round was played.
   * Embedded for offline access during scoring.
   */
  course: co.optional(Course),

  /**
   * The tee played for this round.
   * Embedded for offline access during scoring (hole pars, yardages, handicaps).
   */
  tee: co.optional(Tee),

  scores: MapOfScores,

  /**
   * Legacy ID from ArangoDB v0.3 import (_key field).
   * Used for idempotent imports and tracking migrated rounds.
   */
  legacyId: z.string().optional(),

  /**
   * Tee data overrides for this round.
   * Used when importing legacy games where tee configuration differs from current GHIN data.
   * Takes precedence over embedded tee data.
   */
  teeOverrides: co.optional(TeeOverrides),

  // posting = co.ref(Posting);
});
export type Round = co.loaded<typeof Round>;

/**
 *  This is graph edge between rounds and games.  It is used to link a round to
 *  a game.  It is a CoMap because it may also have extra handicap fields that
 *  are unique to the round/game pairing.
 */
export const RoundToGame = co.map({
  /**
   *  A reference to the `Round`, serving as the "from" vertex in the edge.  The
   *  "to" vertex is the `Game`, and holds the `rounds` field.
   */
  round: Round,

  /**
   *  A string representing the handicap index in decimal form.  Plus handicaps
   *  include the "+" sign, ex: "+1.5".  This is the player's index as of the
   *  date of the round, persisted here to maintain history and consistency of
   *  game scoring.  Also, this will override the player's handicap_index field
   *  value.
   */
  handicapIndex: z.string(),

  /**
   *  A number representing the course handicap in integer form.  Plus handicaps
   *  are negative here.  ex: -2
   */
  courseHandicap: z.optional(z.number()),

  /**
   *  A number representing the game handicap in integer form.  This is an
   *  agreed-upon change that overrirdes the course handicap.  Plus handicaps
   *  are negative here.  ex: -2
   */
  gameHandicap: z.optional(z.number()),
});
export type RoundToGame = co.loaded<typeof RoundToGame>;

export const ListOfRounds = co.list(Round);
export type ListOfRounds = co.loaded<typeof ListOfRounds>;

export const ListOfRoundToGames = co.list(RoundToGame);
export type ListOfRoundToGames = co.loaded<typeof ListOfRoundToGames>;
