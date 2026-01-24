/**
 * Read games from JSON files
 *
 * Replaces the ArangoDB dependency for game import.
 * Files are located at data/games/{legacyId}.json
 *
 * File format (compacted):
 * - tees are stored at top-level, referenced by tee_id in rounds
 * - JSON is minified (single line)
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { GameWithRoundsV03 } from "spicylib/transform/legacy-types";

/** Tee data as stored in the compacted file */
interface StoredTeeData {
  tee_id: number;
  name: string;
  TotalYardage: number;
  holes: Array<{
    hole: number;
    hole_id: number;
    length: number;
    par: number;
    handicap: number;
  }>;
  course?: unknown; // Course data if present
}

/** Round data in compacted format (tee_id instead of tees array) */
interface CompactedRound {
  _id: string;
  _key: string;
  _rev: string;
  date: string;
  scores: unknown[];
  seq: number;
  tee_id?: number;
  tees?: StoredTeeData[]; // May still exist in non-compacted files
}

/** File format for compacted game JSON */
interface CompactedGameFile {
  legacyId: string;
  exportedAt: string;
  game: GameWithRoundsV03["game"];
  rounds: Array<{
    edge: unknown;
    playerId: string;
    round: CompactedRound;
  }>;
  gamespecKey: string;
  /** Deduped tees stored at top level, keyed by tee_id */
  tees?: Record<number, StoredTeeData>;
}

export interface ExportedGame {
  legacyId: string;
  exportedAt: string;
  game: GameWithRoundsV03["game"];
  rounds: GameWithRoundsV03["rounds"];
  gamespecKey: string;
}

export interface GamesIndex {
  exportedAt: string;
  totalGames: number;
  games: Array<{
    legacyId: string;
    name: string;
    start: string;
    playerCount: number;
    roundCount: number;
  }>;
  /** Map of player legacy ID to array of game legacy IDs */
  playerGames: Record<string, string[]>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const gamesDir = join(__dirname, "../../data/games");

/**
 * Load the games index file
 *
 * @returns GamesIndex with game list and player-to-games mapping
 */
export async function loadGamesIndex(): Promise<GamesIndex> {
  const filePath = join(gamesDir, "_index.json");
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as GamesIndex;
}

/**
 * Load a specific game by legacy ID
 *
 * Handles both compacted format (tees at top level, tee_id in rounds)
 * and original format (tees array in each round).
 *
 * @param legacyId - The game's ArangoDB _key
 * @returns ExportedGame or null if file doesn't exist
 */
export async function loadGame(legacyId: string): Promise<ExportedGame | null> {
  const filePath = join(gamesDir, `${legacyId}.json`);

  try {
    const content = await readFile(filePath, "utf-8");
    const compacted = JSON.parse(content) as CompactedGameFile;

    // If file has top-level tees, expand back to original format
    if (compacted.tees) {
      const teesMap = compacted.tees;

      // Expand each round's tee_id back to tees array
      const expandedRounds = compacted.rounds.map((roundWrapper) => {
        const round = roundWrapper.round;

        // If round already has tees array, use it (non-compacted)
        if (round.tees && round.tees.length > 0) {
          return roundWrapper as unknown as GameWithRoundsV03["rounds"][number];
        }

        // Otherwise, expand tee_id to tees array
        if (round.tee_id !== undefined) {
          const teeData = teesMap[round.tee_id];
          if (teeData) {
            // Create expanded round with tees array
            const expandedRound = {
              ...round,
              tees: [teeData],
            };
            // Remove the tee_id field
            delete (expandedRound as { tee_id?: number }).tee_id;
            return {
              ...roundWrapper,
              round: expandedRound,
            } as unknown as GameWithRoundsV03["rounds"][number];
          }
        }

        // Return as-is if no tee data
        return roundWrapper as unknown as GameWithRoundsV03["rounds"][number];
      });

      return {
        legacyId: compacted.legacyId,
        exportedAt: compacted.exportedAt,
        game: compacted.game,
        rounds: expandedRounds,
        gamespecKey: compacted.gamespecKey,
      };
    }

    // No compaction, return as-is
    return compacted as unknown as ExportedGame;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error(`Failed to load game ${legacyId}:`, error);
    return null;
  }
}

/**
 * Get all game legacy IDs for a player
 *
 * @param playerLegacyId - The player's ArangoDB _key
 * @returns Array of game legacy IDs, or empty array if none
 */
export async function getGamesForPlayer(
  playerLegacyId: string,
): Promise<string[]> {
  const index = await loadGamesIndex();
  return index.playerGames[playerLegacyId] || [];
}

/**
 * Load all games for a player
 *
 * @param playerLegacyId - The player's ArangoDB _key
 * @returns Array of ExportedGame objects
 */
export async function loadGamesForPlayer(
  playerLegacyId: string,
): Promise<ExportedGame[]> {
  const gameIds = await getGamesForPlayer(playerLegacyId);
  const games: ExportedGame[] = [];

  for (const gameId of gameIds) {
    const game = await loadGame(gameId);
    if (game) {
      games.push(game);
    }
  }

  return games;
}

/**
 * Count total games available
 */
export async function countGames(): Promise<number> {
  const index = await loadGamesIndex();
  return index.totalGames;
}

/**
 * List all game files (for batch processing)
 *
 * @returns Array of legacy IDs
 */
export async function listAllGameIds(): Promise<string[]> {
  const files = await readdir(gamesDir);
  return files
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.replace(".json", ""));
}
