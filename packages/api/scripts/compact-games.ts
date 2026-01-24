/**
 * One-time script to compact game JSON files:
 * 1. Dedupe tees data - extract to top-level, reference by tee_id in rounds
 * 2. Minify JSON (single line, no formatting)
 *
 * Run with: bun run scripts/compact-games.ts
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const GAMES_DIR = join(import.meta.dir, "../data/games");

interface TeeData {
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
}

interface RoundData {
  _id: string;
  _key: string;
  _rev: string;
  date: string;
  scores: unknown[];
  seq: number;
  tees: TeeData[];
  tee_id?: number; // Will be added after deduping
}

interface ExportedGame {
  legacyId: string;
  exportedAt: string;
  game: unknown;
  rounds: Array<{
    edge: unknown;
    playerId: string;
    round: RoundData;
  }>;
  gamespecKey: string;
  tees?: Record<number, TeeData>; // Deduped tees at top level
}

async function compactGame(filePath: string): Promise<{
  before: number;
  after: number;
  teesDeduped: number;
}> {
  const content = await readFile(filePath, "utf-8");
  const before = content.length;

  const game: ExportedGame = JSON.parse(content);

  // Extract unique tees
  const teesMap = new Map<number, TeeData>();

  for (const roundWrapper of game.rounds) {
    const round = roundWrapper.round;
    if (round.tees && round.tees.length > 0) {
      // Store each unique tee
      for (const tee of round.tees) {
        if (!teesMap.has(tee.tee_id)) {
          teesMap.set(tee.tee_id, tee);
        }
      }
      // Replace tees array with just the tee_id used (first one, or we could pick based on player)
      // For now, just keep the first tee_id reference
      round.tee_id = round.tees[0].tee_id;
      delete (round as Partial<RoundData>).tees;
    }
  }

  // Add deduped tees at top level if we found any
  if (teesMap.size > 0) {
    game.tees = Object.fromEntries(teesMap);
  }

  // Write minified JSON (no formatting)
  const compacted = JSON.stringify(game);
  await writeFile(filePath, compacted);

  return {
    before,
    after: compacted.length,
    teesDeduped: teesMap.size,
  };
}

async function main() {
  console.log("Compacting game files...\n");

  const files = await readdir(GAMES_DIR);
  const gameFiles = files.filter(
    (f) => f.endsWith(".json") && f !== "_index.json",
  );

  let totalBefore = 0;
  let totalAfter = 0;
  let totalTeesDeduped = 0;

  for (const file of gameFiles) {
    const filePath = join(GAMES_DIR, file);
    const result = await compactGame(filePath);

    totalBefore += result.before;
    totalAfter += result.after;
    totalTeesDeduped += result.teesDeduped;

    const savings = result.before - result.after;
    if (savings > 1000) {
      console.log(
        `${file}: ${(result.before / 1024).toFixed(1)}KB -> ${(result.after / 1024).toFixed(1)}KB (saved ${(savings / 1024).toFixed(1)}KB, ${result.teesDeduped} tees)`,
      );
    }
  }

  // Also compact the index file
  const indexPath = join(GAMES_DIR, "_index.json");
  const indexContent = await readFile(indexPath, "utf-8");
  const indexBefore = indexContent.length;
  const indexData = JSON.parse(indexContent);
  const indexCompacted = JSON.stringify(indexData);
  await writeFile(indexPath, indexCompacted);
  const indexAfter = indexCompacted.length;

  totalBefore += indexBefore;
  totalAfter += indexAfter;

  console.log(
    `\n_index.json: ${(indexBefore / 1024).toFixed(1)}KB -> ${(indexAfter / 1024).toFixed(1)}KB`,
  );

  console.log("\n=== Summary ===");
  console.log(`Total files: ${gameFiles.length + 1}`);
  console.log(`Total tees deduped: ${totalTeesDeduped}`);
  console.log(
    `Total size: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`,
  );
  console.log(
    `Savings: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)}MB (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`,
  );
}

main().catch(console.error);
