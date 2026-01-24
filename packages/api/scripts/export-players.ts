/**
 * Export players from ArangoDB to JSON file
 *
 * This is a one-time migration script to remove the runtime dependency on ArangoDB.
 * After running, players are read from data/players.json
 *
 * Usage: bun run scripts/export-players.ts
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createArangoConnection,
  defaultConfig,
  fetchPlayersWithGames,
  type PlayerV03,
} from "../src/utils/arango";

interface ExportedPlayer {
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
}

interface PlayersExport {
  exportedAt: string;
  count: number;
  players: ExportedPlayer[];
}

async function exportPlayers(): Promise<void> {
  console.log("Connecting to ArangoDB...");
  const db = createArangoConnection(defaultConfig);

  console.log("Fetching players with games...");
  const arangoPlayers = await fetchPlayersWithGames(db);
  console.log(`Found ${arangoPlayers.length} players to export`);

  // Map to exported format (strip internal fields)
  const players: ExportedPlayer[] = arangoPlayers.map((player: PlayerV03) => ({
    _key: player._key,
    name: player.name,
    short: player.short,
    gender: player.gender,
    handicap: player.handicap,
    clubs: player.clubs,
  }));

  const exportData: PlayersExport = {
    exportedAt: new Date().toISOString(),
    count: players.length,
    players,
  };

  // Write to single JSON file
  const outputPath = join(import.meta.dir, "../data/players.json");
  await writeFile(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\nExport complete!`);
  console.log(`  Players exported: ${players.length}`);
  console.log(`  Output: ${outputPath}`);
}

exportPlayers().catch((error) => {
  console.error("Export failed:", error);
  process.exit(1);
});
