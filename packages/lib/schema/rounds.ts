import { co, z } from "jazz-tools";
import { Course, Tee } from "./courses";
import { RoundScores, ScoreHistory } from "./scores";

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

export const Round = co
  .map({
    /**
     * When the round was played. Mirrors `game.start` — updated if the
     * game's tee-time date changes. For the immutable creation timestamp
     * use `$jazz.createdAt`.
     */
    start: z.date(),

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

    /**
     * Scores for this round, keyed by hole number (1-indexed: "1"-"18")
     * Flat structure for direct access: round.scores["5"].gross
     */
    scores: RoundScores,

    /**
     * Optional history feed (lazy-loaded) tracking score changes
     * Append-only log of all score modifications
     */
    history: co.optional(ScoreHistory),

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

    /** Schema version for migrations. Omitted on v1 rounds (pre-rename). */
    _v: z.number().optional(),

    // posting = co.ref(Posting);
  })
  .withMigration((round) => {
    // v1 → v2: rename createdAt → start
    // Old rounds stored the play date under "createdAt". Read the raw ISO
    // string and copy it to "start", then stamp the version so this runs once.
    if (!round._v) {
      const raw = round.$jazz.raw as { get(key: string): unknown };
      const legacy = raw.get("createdAt") as string | undefined;
      if (legacy) {
        round.$jazz.set("start", new Date(legacy));
      }
      round.$jazz.set("_v", 2);
    }
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

/**
 * Pre-defined resolved types for common loading patterns.
 * Use these with .load() or ensureLoaded to get type-safe deeply loaded objects.
 *
 * Example:
 *   const round = await RoundWithCourseTee.load(roundId);
 *   // round.course and round.tee are guaranteed loaded
 */
export const RoundWithCourseTee = Round.resolved({
  course: true,
  tee: true,
});
export type RoundWithCourseTee = co.loaded<typeof RoundWithCourseTee>;

export const RoundWithCourseTeeFacility = Round.resolved({
  course: { facility: true },
  tee: true,
});
export type RoundWithCourseTeeFacility = co.loaded<
  typeof RoundWithCourseTeeFacility
>;
