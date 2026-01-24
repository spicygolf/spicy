#!/usr/bin/env bun

/**
 * Update Game Spec Reference
 *
 * Updates a game's spec and specRef to point to the current catalog spec.
 * Creates a new working copy in game.spec and sets specRef to the catalog spec.
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
import { copySpecOptions, getSpecField } from "spicylib/scoring";

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
    // Load the game with spec
    const game = await Game.load(gameId as ID<Game>, {
      resolve: { spec: true, specRef: true },
    });

    if (!game?.$isLoaded) {
      console.error(`Failed to load game: ${gameId}`);
      process.exit(1);
    }

    console.log(`\nCurrent game: ${game.name}`);
    const currentSpec = game.specRef;
    const currentSpecName = currentSpec?.$isLoaded
      ? getSpecField(currentSpec, "name")
      : "(none)";
    console.log(`  Current specRef ID: ${currentSpec?.$jazz?.id || "(none)"}`);
    console.log(`  Current specRef name: ${currentSpecName}`);

    // Load the new spec with all options
    const newSpec = await GameSpec.load(newSpecId as ID<GameSpec>, {
      resolve: { $each: true },
    });

    if (!newSpec?.$isLoaded) {
      console.error(`Failed to load new spec: ${newSpecId}`);
      process.exit(1);
    }

    const newSpecName = getSpecField(newSpec, "name");
    const newSpecVersion = getSpecField(newSpec, "version");
    console.log(`  New spec: ${newSpecName} v${newSpecVersion}`);

    // Create a copy of the spec options for game.spec (working copy)
    const specCopy = await copySpecOptions(newSpec, game.$jazz.owner);
    console.log(`\nCreated working copy of spec options`);

    // Update game.spec (working copy) and game.specRef (catalog reference)
    game.$jazz.set("spec", specCopy);
    game.$jazz.set("specRef", newSpec);
    console.log(`Set game.spec and game.specRef`);

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
