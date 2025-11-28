import { Database } from "arangojs";

export interface ArangoConfig {
  url: string;
  databaseName: string;
  username: string;
  password: string;
}

export const defaultConfig: ArangoConfig = {
  url: "http://localhost:8529",
  databaseName: "dg",
  username: "dg",
  password: "dg",
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
  default_options?: unknown[];
  todos?: string[];
}

export async function fetchGameSpecs(db: Database): Promise<GameSpecV03[]> {
  try {
    const cursor = await db.query("FOR spec IN gamespecs RETURN spec");
    const specs = await cursor.all();
    return specs as GameSpecV03[];
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
