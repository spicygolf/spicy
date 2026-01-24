/**
 * File-based Player Loader
 *
 * Loads players from the exported JSON file instead of ArangoDB.
 * Data is in data/players.json exported by scripts/export-players.ts
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ExportedPlayer {
  _key: string;
  name: string;
  short?: string;
  gender?: "M" | "F";
  handicap?: {
    source?: "ghin" | "manual";
    id?: string;
    display?: string;
    index?: number | string;
    revDate?: string;
  };
  clubs?: Array<{
    name: string;
    state?: string;
  }>;
}

interface PlayersExport {
  exportedAt: string;
  count: number;
  players: ExportedPlayer[];
}

// Path to players data file
const PLAYERS_PATH = join(process.cwd(), "data/players.json");

// Cache to avoid re-reading file
let playersCache: ExportedPlayer[] | null = null;

/**
 * Load all players from the exported JSON file
 */
export async function loadPlayers(): Promise<ExportedPlayer[]> {
  if (playersCache) {
    return playersCache;
  }

  try {
    const content = await readFile(PLAYERS_PATH, "utf-8");
    const data = JSON.parse(content) as PlayersExport;
    playersCache = data.players;
    console.log(`Loaded ${playersCache.length} players from file`);
    return playersCache;
  } catch (error) {
    console.error("Failed to load players from file:", error);
    return [];
  }
}

/**
 * Clear the players cache (useful for testing)
 */
export function clearPlayersCache(): void {
  playersCache = null;
}
