import { Database } from "arangojs";
import longDescriptionsData from "../../data/gamespec-long-descriptions.json";

export interface ArangoConfig {
  url: string;
  databaseName: string;
  username: string;
  password: string;
}

export const defaultConfig: ArangoConfig = {
  url: process.env.ARANGO_URL || "http://localhost:8529",
  databaseName: process.env.ARANGO_DATABASE || "dg",
  username: process.env.ARANGO_USERNAME || "dg",
  password: process.env.ARANGO_PASSWORD || "dg",
};

export function createArangoConnection(
  config: ArangoConfig = defaultConfig,
): Database {
  const db = new Database({
    url: config.url,
    databaseName: config.databaseName,
    auth: { username: config.username, password: config.password },
  });

  return db;
}

export async function testConnection(db: Database): Promise<boolean> {
  try {
    await db.version();
    return true;
  } catch (error) {
    console.error("ArangoDB connection failed:", error);
    return false;
  }
}

export interface GameSpecV03 {
  _key?: string;
  legacy_keys?: string[]; // Additional legacy keys (for consolidated specs like Match Play)
  name: string;
  disp: string;
  version: number;
  status: "prod" | "dev" | "test";
  type: "points" | "skins";
  max_players: number;
  min_players: number;
  location_type: "local" | "virtual";
  long_description?: string;
  teams?: boolean;
  team_size?: number;
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
  }>;
  /** Embedded meta options for unified format (new architecture) */
  meta?: Array<{
    name: string;
    disp: string;
    valueType: "bool" | "num" | "menu" | "text" | "text_array";
    value?: string | string[];
    choices?: Array<{ name: string; disp: string }>;
    seq?: number;
    searchable?: boolean;
    required?: boolean;
  }>;
  default_options?: unknown[];
  todos?: string[];
}

export async function fetchGameSpecs(db: Database): Promise<GameSpecV03[]> {
  try {
    const cursor = await db.query("FOR spec IN gamespecs RETURN spec");
    const specs = (await cursor.all()) as GameSpecV03[];

    // Merge long_description data using _key from imported JSON
    const longDescriptions = longDescriptionsData as Record<
      string,
      { long_description: string }
    >;

    for (const spec of specs) {
      if (spec._key && longDescriptions[spec._key]) {
        spec.long_description = longDescriptions[spec._key].long_description;
      }
    }

    return specs;
  } catch (error) {
    console.error("Failed to fetch game specs:", error);
    throw error;
  }
}

export interface PlayerV03 {
  _key: string;
  name: string;
  short?: string;
  gender: "M" | "F";
  handicap?: {
    source: "ghin" | "manual";
    id?: string;
    display?: string;
    index?: number;
    revDate?: string;
  };
  clubs?: Array<{
    name: string;
    state?: string;
  }>;
  statusAuthz?: string[];
}

export async function fetchPlayersWithGames(
  db: Database,
): Promise<PlayerV03[]> {
  try {
    const cursor = await db.query(`
      FOR player IN players
        LET hasGames = (
          FOR v, e IN 1..1 ANY player._id GRAPH 'games'
            FILTER e.type == 'player2game'
            LIMIT 1
            RETURN 1
        )
        FILTER LENGTH(hasGames) > 0
        RETURN player
    `);
    const players = await cursor.all();
    return players as PlayerV03[];
  } catch (error) {
    console.error("Failed to fetch players:", error);
    throw error;
  }
}

export interface TeeRating {
  rating: number;
  slope: number;
  bogey: number;
}

/**
 * Raw rating format as stored in ArangoDB
 * Array of objects with RatingType discriminator
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

export interface GameListV03 {
  _key: string;
  name: string;
  start: string;
  playerCount: number;
  roundCount: number;
}

export async function fetchGameWithRounds(
  db: Database,
  gameKey: string,
): Promise<GameWithRoundsV03 | null> {
  try {
    const cursor = await db.query(
      `
      LET game = DOCUMENT("games", @gameKey)
      LET gamespec = FIRST(
        FOR v, e IN 1..1 OUTBOUND game._id GRAPH 'games'
          FILTER e.type == 'game2gamespec'
          RETURN v._key
      )
      LET rounds = (
        FOR v, e IN 1..1 INBOUND game._id GRAPH 'games'
          FILTER e.type == 'round2game'
          LET player = FIRST(
            FOR p, pe IN 1..1 OUTBOUND v._id GRAPH 'games'
              FILTER pe.type == 'round2player'
              RETURN p._key
          )
          LET tees = (
            FOR t, te IN 1..1 OUTBOUND v._id GRAPH 'games'
              FILTER te.type == 'round2tee'
              LET course = FIRST(
                FOR c, ce IN 1..1 OUTBOUND t._id GRAPH 'games'
                  FILTER ce.type == 'tee2course'
                  RETURN {
                    course_id: c.course_id,
                    course_name: c.name,
                    course_city: c.city,
                    course_state: c.state
                  }
              )
              RETURN {
                tee_id: t.tee_id || t._key,
                name: t.name,
                TotalYardage: t.TotalYardage,
                holes: t.holes,
                Ratings: t.Ratings,
                course: course
              }
          )
          RETURN { round: MERGE(v, { tees }), edge: e, playerId: player }
      )
      RETURN { game, rounds, gamespecKey: gamespec }
    `,
      { gameKey },
    );

    const result = await cursor.next();
    if (!result || !result.game) {
      return null;
    }

    return result as GameWithRoundsV03;
  } catch (error) {
    console.error(
      `Failed to fetch game with rounds for key ${gameKey}:`,
      error,
    );
    throw error;
  }
}

export interface FetchAllGamesResult {
  games: GameListV03[];
  total: number;
}

export async function fetchAllGames(
  db: Database,
  offset = 0,
  limit = 100,
): Promise<FetchAllGamesResult> {
  try {
    // Get total count
    const countCursor = await db.query(`
      RETURN LENGTH(games)
    `);
    const total = (await countCursor.next()) as number;

    // Get paginated games with metadata
    const gamesCursor = await db.query(
      `
      FOR game IN games
        SORT game.start DESC
        LIMIT @offset, @limit
        LET roundCount = LENGTH(
          FOR v, e IN 1..1 INBOUND game._id GRAPH 'games'
            FILTER e.type == 'round2game'
            RETURN 1
        )
        LET playerCount = LENGTH(
          FOR v, e IN 1..1 OUTBOUND game._id GRAPH 'games'
            FILTER e.type == 'player2game'
            RETURN 1
        )
        RETURN {
          _key: game._key,
          name: game.name,
          start: game.start,
          playerCount: playerCount,
          roundCount: roundCount
        }
    `,
      { offset, limit },
    );

    const games = (await gamesCursor.all()) as GameListV03[];

    return { games, total };
  } catch (error) {
    console.error("Failed to fetch all games:", error);
    throw error;
  }
}

export interface FavoritePlayerEdge {
  playerKey: string;
  favoritePlayerKey: string;
  addedAt?: string;
}

export interface FavoriteCourseTeeEdge {
  playerKey: string;
  teeId: string;
  courseId: string;
  addedAt?: string;
}

/**
 * Fetch favorite players for all players from ArangoDB
 * Returns player2player edges where favorite == 'true'
 */
export async function fetchAllFavoritePlayers(
  db: Database,
): Promise<FavoritePlayerEdge[]> {
  try {
    const cursor = await db.query(`
      FOR player IN players
        FOR v, e, p IN 1..1 OUTBOUND player._id
          GRAPH 'games'
          FILTER e.type == 'player2player' AND e.favorite == 'true'
          RETURN {
            playerKey: player._key,
            favoritePlayerKey: v._key,
            addedAt: e.created_at
          }
    `);
    const favorites = await cursor.all();
    return favorites as FavoritePlayerEdge[];
  } catch (error) {
    console.error("Failed to fetch favorite players:", error);
    throw error;
  }
}

/**
 * Fetch favorite course/tees for all players from ArangoDB
 * Returns player2tee edges where favorite == 'true'
 */
export async function fetchAllFavoriteCourseTees(
  db: Database,
): Promise<FavoriteCourseTeeEdge[]> {
  try {
    const cursor = await db.query(`
      FOR player IN players
        FOR v, e, p IN 1..1 OUTBOUND player._id
          GRAPH 'games'
          FILTER e.type == 'player2tee' AND e.favorite == 'true'
          LET course = FIRST(
            FOR c, ce IN 1..1 OUTBOUND v._id GRAPH 'games'
              FILTER ce.type == 'tee2course'
              RETURN c
          )
          RETURN {
            playerKey: player._key,
            teeId: v.tee_id || v._key,
            courseId: course.course_id,
            addedAt: e.created_at
          }
    `);
    const favorites = await cursor.all();
    return favorites as FavoriteCourseTeeEdge[];
  } catch (error) {
    console.error("Failed to fetch favorite course/tees:", error);
    throw error;
  }
}
