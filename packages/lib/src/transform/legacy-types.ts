/**
 * ArangoDB Type Definitions
 *
 * Type definitions for data structures from the legacy ArangoDB v0.3 system.
 * Used for importing and transforming historical game data.
 *
 * NOTE: No runtime ArangoDB dependency is required for these types.
 */

export interface GameSpecV03 {
  _key?: string;
  legacy_keys?: string[]; // Additional legacy keys (for consolidated specs like Match Play)
  name: string;
  disp: string;
  version: number;
  status: "prod" | "dev" | "test";
  type: "points" | "skins";
  max_players?: number;
  min_players: number;
  location_type: "local" | "virtual";
  long_description?: string;
  teams?: boolean;
  team_size?: number;
  num_teams?: number;
  team_determination?: string;
  team_change_every?: number;
  scoring?: Record<string, unknown>;
  junk?: Array<{
    name: string;
    disp: string;
    type: string;
    value: number;
    [key: string]: unknown;
  }>;
  multipliers?: Array<{
    name: string;
    disp: string;
    value: number;
    [key: string]: unknown;
  }>;
  options?: Array<{
    name: string;
    disp: string;
    type: string;
    default?: unknown;
    choices?: Array<{ name: string; disp: string }>;
    teamOnly?: boolean;
  }>;
  meta?: Array<{
    name: string;
    disp: string;
    valueType: string;
    value?: string | string[];
    choices?: Array<{ name: string; disp: string }>;
    seq?: number;
    searchable?: boolean;
    required?: boolean;
  }>;
  default_options?: unknown[];
  todos?: string[];
}

export interface TeeRating {
  rating: number;
  slope: number;
  bogey: number;
}

/**
 * Raw rating format as stored in ArangoDB
 */
export interface ArangoTeeRating {
  RatingType: "Total" | "Front" | "Back";
  CourseRating: number;
  SlopeRating: number;
  BogeyRating: number;
}

/**
 * Convert ArangoDB ratings array to the format used in Jazz schema
 */
export function convertArangoRatings(ratings: ArangoTeeRating[] | undefined): {
  total: TeeRating;
  front: TeeRating;
  back: TeeRating;
} {
  const defaultRating: TeeRating = { rating: 0, slope: 0, bogey: 0 };

  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return { total: defaultRating, front: defaultRating, back: defaultRating };
  }

  function findRating(ratingsArr: ArangoTeeRating[], type: string): TeeRating {
    const r = ratingsArr.find(
      (r) => r.RatingType?.toLowerCase() === type.toLowerCase(),
    );
    if (r) {
      return {
        rating: r.CourseRating,
        slope: r.SlopeRating,
        bogey: r.BogeyRating,
      };
    }
    return defaultRating;
  }

  return {
    total: findRating(ratings, "Total"),
    front: findRating(ratings, "Front"),
    back: findRating(ratings, "Back"),
  };
}

export interface RoundV03 {
  _key: string;
  date: string;
  seq: number;
  scores: Array<{
    hole: string;
    values: Array<{ k: string; v: string; ts?: string }>;
  }>;
  tees: Array<{
    tee_id: string;
    course_id: string;
    name: string;
    TotalYardage: number;
    holes: Array<{
      hole: string;
      par: number;
      length: number;
      handicap: number;
    }>;
    Ratings: ArangoTeeRating[];
    course: {
      course_id: string;
      course_name: string;
      course_city?: string;
      course_state?: string;
    };
  }>;
}

export interface GameV03 {
  _key: string;
  name: string;
  start: string;
  scope: {
    holes: string;
    teams_rotate?: string;
    wolf_order?: string[];
  };
  holes: Array<{
    hole: string;
    teams: Array<{
      team: string;
      players: string[];
      junk?: Array<{ name: string; player: string; value: string }>;
    }>;
    multipliers?: Array<{
      name: string;
      team: string;
      first_hole: string;
      value: number;
    }>;
  }>;
  options?: Array<
    | {
        // Game-level option: applies to entire game
        name: string;
        disp?: string;
        type?: string;
        value: string;
      }
    | {
        // Hole-level option: applies to specific holes
        name: string;
        values: Array<{ value: string; holes: string[] }>;
      }
  >;
}

export interface RoundToGameEdgeV03 {
  handicap_index: string;
  course_handicap?: number;
  game_handicap?: number;
}

export interface GameWithRoundsV03 {
  game: GameV03;
  rounds: Array<{
    round: RoundV03;
    edge: RoundToGameEdgeV03;
    playerId: string;
  }>;
  gamespecKey: string;
}
