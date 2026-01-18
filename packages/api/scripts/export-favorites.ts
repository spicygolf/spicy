/**
 * Export player favorites from ArangoDB to JSON files
 *
 * This is a one-time migration script to remove the runtime dependency on ArangoDB.
 * After running, favorites are read from data/favorites/{legacyPlayerId}.json
 *
 * Usage: bun run scripts/export-favorites.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createArangoConnection,
  defaultConfig,
  fetchAllFavoriteCourseTees,
  fetchAllFavoritePlayers,
} from "../src/utils/arango";

interface PlayerFavorites {
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

async function exportFavorites(): Promise<void> {
  console.log("Connecting to ArangoDB...");
  const db = createArangoConnection(defaultConfig);

  console.log("Fetching all favorite players...");
  const allFavoritePlayers = await fetchAllFavoritePlayers(db);
  console.log(`Found ${allFavoritePlayers.length} favorite player edges`);

  console.log("Fetching all favorite course/tees...");
  const allFavoriteCourseTees = await fetchAllFavoriteCourseTees(db);
  console.log(
    `Found ${allFavoriteCourseTees.length} favorite course/tee edges`,
  );

  // Build a map of player legacy IDs to GHIN IDs
  console.log("Building player GHIN ID lookup map...");
  const playerGhinMap = new Map<string, string | null>();
  const uniqueFavoritePlayerKeys = new Set<string>();

  for (const fav of allFavoritePlayers) {
    uniqueFavoritePlayerKeys.add(fav.favoritePlayerKey);
  }

  // Query GHIN IDs in batches
  const playerKeys = Array.from(uniqueFavoritePlayerKeys);
  console.log(
    `Looking up GHIN IDs for ${playerKeys.length} unique favorite players...`,
  );

  for (const key of playerKeys) {
    const cursor = await db.query(
      `LET player = DOCUMENT("players", @key) RETURN player.handicap.id`,
      { key },
    );
    const ghinId = await cursor.next();
    playerGhinMap.set(key, ghinId || null);
  }
  console.log(`Resolved ${playerGhinMap.size} GHIN ID mappings`);

  // Group by player with deduplication
  const playerFavoritesMap = new Map<string, PlayerFavorites>();

  // Track seen entries for deduplication
  const seenFavoritePlayers = new Map<string, Set<string>>(); // playerKey -> Set<favoritePlayerKey>
  const seenFavoriteCourseTees = new Map<string, Set<string>>(); // playerKey -> Set<courseId-teeId>

  for (const fav of allFavoritePlayers) {
    if (!playerFavoritesMap.has(fav.playerKey)) {
      playerFavoritesMap.set(fav.playerKey, {
        legacyPlayerId: fav.playerKey,
        exportedAt: new Date().toISOString(),
        favoritePlayers: [],
        favoriteCourseTees: [],
      });
      seenFavoritePlayers.set(fav.playerKey, new Set());
    }

    // Deduplicate by favoritePlayerKey
    const seen = seenFavoritePlayers.get(fav.playerKey)!;
    if (!seen.has(fav.favoritePlayerKey)) {
      seen.add(fav.favoritePlayerKey);
      playerFavoritesMap.get(fav.playerKey)!.favoritePlayers.push({
        favoritePlayerKey: fav.favoritePlayerKey,
        ghinId: playerGhinMap.get(fav.favoritePlayerKey) ?? null,
        addedAt: fav.addedAt,
      });
    }
  }

  for (const fav of allFavoriteCourseTees) {
    if (!playerFavoritesMap.has(fav.playerKey)) {
      playerFavoritesMap.set(fav.playerKey, {
        legacyPlayerId: fav.playerKey,
        exportedAt: new Date().toISOString(),
        favoritePlayers: [],
        favoriteCourseTees: [],
      });
      seenFavoriteCourseTees.set(fav.playerKey, new Set());
    }

    if (!seenFavoriteCourseTees.has(fav.playerKey)) {
      seenFavoriteCourseTees.set(fav.playerKey, new Set());
    }

    // Deduplicate by composite key (courseId + teeId)
    const compositeKey = `${fav.courseId}-${fav.teeId}`;
    const seen = seenFavoriteCourseTees.get(fav.playerKey)!;
    if (!seen.has(compositeKey)) {
      seen.add(compositeKey);
      playerFavoritesMap.get(fav.playerKey)!.favoriteCourseTees.push({
        courseId: fav.courseId,
        teeId: fav.teeId,
        addedAt: fav.addedAt,
      });
    }
  }

  // Write to files
  const outputDir = join(import.meta.dir, "../data/favorites");
  await mkdir(outputDir, { recursive: true });

  let filesWritten = 0;
  for (const [legacyPlayerId, favorites] of playerFavoritesMap) {
    const filePath = join(outputDir, `${legacyPlayerId}.json`);
    await writeFile(filePath, `${JSON.stringify(favorites, null, 2)}\n`);
    filesWritten++;
  }

  console.log(`\nExport complete!`);
  console.log(`  - Players with favorites: ${playerFavoritesMap.size}`);
  console.log(`  - Files written: ${filesWritten}`);
  console.log(`  - Output directory: ${outputDir}`);
}

exportFavorites().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
