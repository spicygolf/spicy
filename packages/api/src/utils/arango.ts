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
