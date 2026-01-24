/**
 * Export games from ArangoDB to JSON files
 *
 * This is a one-time migration script to remove the runtime dependency on ArangoDB.
 * After running, games are read from data/games/{legacyId}.json
 *
 * Usage: bun run scripts/export-games.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createArangoConnection,
  defaultConfig,
  fetchAllGames,
  fetchGameWithRounds,
  type GameWithRoundsV03,
} from "../src/utils/arango";

interface ExportedGame {
  legacyId: string;
  exportedAt: string;
  game: GameWithRoundsV03["game"];
  rounds: GameWithRoundsV03["rounds"];
  gamespecKey: string;
}

async function exportGames(): Promise<void> {
  console.log("Connecting to ArangoDB...");
  const db = createArangoConnection(defaultConfig);

  // First, get the total count
  console.log("Fetching game list...");
  const { total } = await fetchAllGames(db, 0, 1);
  console.log(`Found ${total} games to export`);

  // Create output directory
  const outputDir = join(import.meta.dir, "../data/games");
  await mkdir(outputDir, { recursive: true });

  // Fetch all games (in batches for memory efficiency)
  const batchSize = 50;
  let exported = 0;
  let failed = 0;
  const errors: Array<{ gameKey: string; error: string }> = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const { games } = await fetchAllGames(db, offset, batchSize);

    for (const gameSummary of games) {
      try {
        const gameData = await fetchGameWithRounds(db, gameSummary._key);

        if (!gameData || !gameData.game) {
          errors.push({
            gameKey: gameSummary._key,
            error: "Failed to fetch game details",
          });
          failed++;
          continue;
        }

        const exportedGame: ExportedGame = {
          legacyId: gameSummary._key,
          exportedAt: new Date().toISOString(),
          game: gameData.game,
          rounds: gameData.rounds,
          gamespecKey: gameData.gamespecKey,
        };

        const filePath = join(outputDir, `${gameSummary._key}.json`);
        await writeFile(filePath, `${JSON.stringify(exportedGame, null, 2)}\n`);
        exported++;

        // Progress indicator
        if (exported % 10 === 0) {
          console.log(`Exported ${exported}/${total} games...`);
        }
      } catch (error) {
        errors.push({
          gameKey: gameSummary._key,
          error: error instanceof Error ? error.message : String(error),
        });
        failed++;
      }
    }
  }

  // Build player-to-games mapping by reading exported files
  // (rounds have playerId which tells us who played in each game)
  console.log("\nBuilding player-to-games index from exported files...");
  const playerGamesMap = new Map<string, string[]>();
  const gamesList: Array<{
    legacyId: string;
    name: string;
    start: string;
    playerCount: number;
    roundCount: number;
  }> = [];

  const { readdir, readFile } = await import("node:fs/promises");
  const files = await readdir(outputDir);

  for (const file of files) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;

    const filePath = join(outputDir, file);
    const content = await readFile(filePath, "utf-8");
    const gameData = JSON.parse(content) as ExportedGame;

    // Extract unique player IDs from rounds
    const playerIds = new Set<string>();
    for (const roundData of gameData.rounds) {
      if (roundData.playerId) {
        playerIds.add(roundData.playerId);
      }
    }

    // Add to player-games mapping
    for (const playerId of playerIds) {
      if (!playerGamesMap.has(playerId)) {
        playerGamesMap.set(playerId, []);
      }
      playerGamesMap.get(playerId)?.push(gameData.legacyId);
    }

    // Add to games list
    gamesList.push({
      legacyId: gameData.legacyId,
      name: gameData.game.name,
      start: gameData.game.start,
      playerCount: playerIds.size,
      roundCount: gameData.rounds.length,
    });
  }

  // Sort games by start date (most recent first)
  gamesList.sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
  );

  // Write index file
  const indexPath = join(outputDir, "_index.json");
  const indexData = {
    exportedAt: new Date().toISOString(),
    totalGames: gamesList.length,
    games: gamesList,
    playerGames: Object.fromEntries(playerGamesMap),
  };

  await writeFile(indexPath, `${JSON.stringify(indexData, null, 2)}\n`);

  console.log(`\nExport complete!`);
  console.log(`  - Games exported: ${exported}`);
  console.log(`  - Games failed: ${failed}`);
  console.log(`  - Output directory: ${outputDir}`);

  if (errors.length > 0) {
    console.log(`\nErrors:`);
    for (const err of errors.slice(0, 10)) {
      console.log(`  - ${err.gameKey}: ${err.error}`);
    }
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }
}

exportGames().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
