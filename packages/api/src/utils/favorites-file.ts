/**
 * Read player favorites from JSON files
 *
 * Replaces the ArangoDB dependency for favorites import.
 * Files are located at data/favorites/{legacyPlayerId}.json
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface PlayerFavorites {
  legacyPlayerId: string;
  exportedAt: string;
  favoritePlayers: Array<{
    favoritePlayerKey: string;
    ghinId: string | null; // Pre-resolved GHIN ID for catalog lookup
    addedAt?: string;
  }>;
  favoriteCourseTees: Array<{
    courseId: string; // GHIN course ID as string
    teeId: string; // GHIN tee ID as string
    addedAt?: string;
  }>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const favoritesDir = join(__dirname, "../../data/favorites");

/**
 * Load favorites for a specific player from their JSON file
 *
 * @param legacyPlayerId - The player's ArangoDB _key
 * @returns PlayerFavorites or null if file doesn't exist
 */
export async function loadPlayerFavorites(
  legacyPlayerId: string,
): Promise<PlayerFavorites | null> {
  const filePath = join(favoritesDir, `${legacyPlayerId}.json`);

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as PlayerFavorites;
  } catch (error) {
    // File not found is expected for players without favorites
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error(
      `Failed to load favorites for player ${legacyPlayerId}:`,
      error,
    );
    return null;
  }
}
