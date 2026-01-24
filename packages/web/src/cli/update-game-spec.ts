#!/usr/bin/env bun

/**
 * Update Game Spec Reference
 *
 * Updates a game's spec reference to point to the current catalog spec.
 *
 * Usage:
 *   bun run src/cli/update-game-spec.ts <gameId> <newSpecId>
 *
 * Example:
 *   bun run src/cli/update-game-spec.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2 co_zg5ZpS9hkN4P2pFNumajafW41FN
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import type { Account, ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { Game, GameSpec } from "spicylib/schema";

// Load environment from API package
config({ path: resolve(import.meta.dir, "../../../api/.env") });

const JAZZ_API_KEY = process.env.JAZZ_API_KEY;
const JAZZ_WORKER_ACCOUNT = process.env.JAZZ_WORKER_ACCOUNT;
const JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET;

if (!JAZZ_API_KEY || !JAZZ_WORKER_ACCOUNT || !JAZZ_WORKER_SECRET) {
  console.error("Missing Jazz credentials in packages/api/.env");
  console.error(
    "Required: JAZZ_API_KEY, JAZZ_WORKER_ACCOUNT, JAZZ_WORKER_SECRET",
  );
  process.exit(1);
}

async function main() {
  const [gameId, newSpecId] = process.argv.slice(2);

  if (!gameId || !newSpecId) {
    console.log(
      "Usage: bun run src/cli/update-game-spec.ts <gameId> <newSpecId>",
    );
    console.log("\nExample:");
    console.log(
      "  bun run src/cli/update-game-spec.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2 co_zg5ZpS9hkN4P2pFNumajafW41FN",
    );
    process.exit(1);
  }

  console.log(`\nUpdating game spec reference`);
  console.log(`  Game: ${gameId}`);
  console.log(`  New Spec: ${newSpecId}`);

  // Start worker
  await startWorker({
    accountID: JAZZ_WORKER_ACCOUNT as ID<Account>,
    accountSecret: JAZZ_WORKER_SECRET,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
  });

  try {
    // Load the game with specs list
    const game = await Game.load(gameId as ID<Game>, {
      resolve: { specs: { $each: true } },
    });

    if (!game?.$isLoaded) {
      console.error(`Failed to load game: ${gameId}`);
      process.exit(1);
    }

    console.log(`\nCurrent game: ${game.name}`);
    const currentSpec = game.specs?.[0];
    console.log(`  Current spec ID: ${currentSpec?.$jazz?.id || "(none)"}`);
    console.log(`  Current spec name: ${currentSpec?.name || "(none)"}`);

    // Load the new spec
    const newSpec = await GameSpec.load(newSpecId as ID<GameSpec>, {
      resolve: { options: true },
    });

    if (!newSpec?.$isLoaded) {
      console.error(`Failed to load new spec: ${newSpecId}`);
      process.exit(1);
    }

    console.log(`  New spec: ${newSpec.name} v${newSpec.version}`);

    // Update the first element of specs list
    if (game.specs?.$isLoaded && game.specs.length > 0) {
      game.specs.$jazz.splice(0, 1, newSpec);
      console.log(`\nReplaced specs[0] with new spec`);
    } else {
      console.error("Game has no specs list or it's empty");
      process.exit(1);
    }

    console.log(`\nSpec reference updated successfully!`);

    // Wait for sync
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
