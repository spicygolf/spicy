#!/usr/bin/env bun
/**
 * Quick script to check the prox option's limit field on a specific game
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { startWorker } from "jazz-tools/worker";
import { Game, PlayerAccount } from "spicylib/schema";

config({ path: resolve(import.meta.dir, "../packages/api/.env") });

const JAZZ_API_KEY = process.env.JAZZ_API_KEY;
const JAZZ_WORKER_ACCOUNT = process.env.JAZZ_WORKER_ACCOUNT;
const JAZZ_WORKER_SECRET = process.env.JAZZ_WORKER_SECRET;

if (!JAZZ_API_KEY || !JAZZ_WORKER_ACCOUNT || !JAZZ_WORKER_SECRET) {
  console.error("Missing Jazz credentials");
  process.exit(1);
}

const { worker, done } = await startWorker({
  AccountSchema: PlayerAccount,
  syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
  accountID: JAZZ_WORKER_ACCOUNT,
  accountSecret: JAZZ_WORKER_SECRET,
});

const gameId = process.argv[2] || "co_zJkF8xhjVFRNemoSdXZnZrUtHM2";

console.log(`\nChecking game: ${gameId}\n`);

const game = await Game.load(gameId as `co_${string}`, {
  loadAs: worker,
  resolve: { specs: { $each: { options: { prox: true } } } },
});

if (game?.$isLoaded && game.specs?.$isLoaded) {
  const spec = game.specs[0];
  console.log("Game name:", game.name);

  if (spec?.$isLoaded && spec.options?.$isLoaded) {
    console.log("Spec:", spec.name);

    const prox = spec.options.prox;
    if (prox?.$isLoaded) {
      console.log("\nProx option:");
      console.log("  name:", prox.name);
      console.log("  type:", prox.type);
      if (prox.type === "junk") {
        console.log("  value:", prox.value);
        console.log("  based_on:", prox.based_on);
        console.log(
          "  limit:",
          prox.limit,
          prox.limit === "one_per_group" ? "✓" : "✗ MISSING!",
        );
        console.log("  show_in:", prox.show_in);
        console.log("  scope:", prox.scope);
        console.log("  icon:", prox.icon);
      }
    } else {
      console.log("Prox option not loaded or doesn't exist");
    }
  } else {
    console.log("Spec or options not loaded");
  }
} else {
  console.log("Game or specs not loaded");
}

await done();
