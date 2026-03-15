#!/usr/bin/env bun

/**
 * Change a game's spec to a different catalog spec.
 *
 * Updates game.spec (working copy), game.specRef (catalog reference),
 * and recreates game.bets from the new spec's bet options.
 *
 * Usage:
 *   bun run src/cli/change-game-spec.ts <gameId> <specName>
 *
 * Example:
 *   bun run src/cli/change-game-spec.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2 florida_bet
 *
 * The specName should match the "name" field in the spec seed (e.g., "nassau",
 * "closeout", "florida_bet", "matchplay").
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import type { ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import {
  Bet,
  Game,
  GameSpec,
  ListOfBets,
  PlayerAccount,
} from "spicylib/schema";
import { copySpecOptions, getSpecField } from "spicylib/scoring";

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
  const [gameId, specName] = process.argv.slice(2);

  if (!gameId || !specName) {
    console.log(
      "Usage: bun run src/cli/change-game-spec.ts <gameId> <specName>",
    );
    console.log("\nExample:");
    console.log(
      "  bun run src/cli/change-game-spec.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2 florida_bet",
    );
    console.log(
      "\nAvailable spec names: nassau, closeout, florida_bet, matchplay, etc.",
    );
    process.exit(1);
  }

  console.log(`\nChanging game spec`);
  console.log(`  Game: ${gameId}`);
  console.log(`  Target spec: ${specName}`);

  const { worker } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT,
    accountSecret: JAZZ_WORKER_SECRET,
  });

  try {
    // Load game
    const game = await Game.load(gameId as ID<Game>, {
      loadAs: worker,
      resolve: { spec: true, specRef: true, bets: { $each: true } },
    });

    if (!game?.$isLoaded) {
      console.error(`Failed to load game: ${gameId}`);
      process.exit(1);
    }

    const currentSpecName = game.specRef?.$isLoaded
      ? getSpecField(game.specRef, "name")
      : "(none)";
    const currentSpecDisp = game.specRef?.$isLoaded
      ? (getSpecField(game.specRef, "disp") as string)
      : undefined;
    console.log(`\n  Current spec: ${currentSpecName}`);
    console.log(`  Game name: ${game.name}`);

    // Load catalog from worker account profile
    const account = await PlayerAccount.load(
      JAZZ_WORKER_ACCOUNT as ID<typeof PlayerAccount>,
      {
        loadAs: worker,
        resolve: {
          profile: {
            catalog: {
              specs: { $each: true },
            },
          },
        },
      },
    );

    if (!account?.$isLoaded || !account.profile?.$isLoaded) {
      console.error("Failed to load worker account profile");
      process.exit(1);
    }

    const catalog = account.profile.catalog;
    if (!catalog?.$isLoaded) {
      console.error("Failed to load catalog");
      process.exit(1);
    }

    const specs = catalog.specs;
    if (!specs?.$isLoaded) {
      console.error("Failed to load catalog specs");
      process.exit(1);
    }

    // Find the target spec in the catalog by name
    let targetSpec: GameSpec | undefined;
    for (const key of Object.keys(specs)) {
      if (key.startsWith("$") || key.startsWith("_")) continue;
      const spec = specs[key];
      if (spec?.$isLoaded) {
        const name = getSpecField(spec, "name");
        if (name === specName) {
          targetSpec = spec;
          break;
        }
      }
    }

    if (!targetSpec) {
      console.error(`Spec "${specName}" not found in catalog`);
      console.log("\nAvailable specs:");
      for (const key of Object.keys(specs)) {
        if (key.startsWith("$") || key.startsWith("_")) continue;
        const spec = specs[key];
        if (spec?.$isLoaded) {
          const name = getSpecField(spec, "name");
          console.log(`  ${name}`);
        }
      }
      process.exit(1);
    }

    const targetVersion = getSpecField(targetSpec, "version");
    console.log(`  Target spec: ${specName} v${targetVersion}`);

    // Create working copy of spec options
    const specCopy = copySpecOptions(targetSpec, game.$jazz.owner);
    console.log(`  Created working copy of spec options`);

    // Recreate bets from new spec
    const bets = ListOfBets.create([], { owner: game.$jazz.owner });
    let betCount = 0;
    for (const key of Object.keys(targetSpec)) {
      if (key.startsWith("$") || key.startsWith("_")) continue;
      if (!targetSpec.$jazz.has(key)) continue;
      const opt = targetSpec[key];
      if (opt?.type === "bet") {
        const bet = Bet.create(
          {
            name: opt.name,
            disp: opt.disp,
            scope: opt.scope,
            scoringType: opt.scoringType,
            splitType: opt.splitType,
            ...(opt.pct !== undefined && { pct: opt.pct }),
            ...(opt.amount !== undefined && { amount: opt.amount }),
          },
          { owner: game.$jazz.owner },
        );
        bets.$jazz.push(bet);
        betCount++;
        console.log(
          `  Created bet: ${opt.disp} (${opt.scope}, ${opt.scoringType})`,
        );
      }
    }

    // Apply changes
    game.$jazz.set("spec", specCopy);
    game.$jazz.set("specRef", targetSpec);
    game.$jazz.set("bets", bets);

    // Update game name if it still matches the old spec's display name
    const targetDisp = getSpecField(targetSpec, "disp") as string;
    if (currentSpecDisp && game.name === currentSpecDisp) {
      game.$jazz.set("name", targetDisp);
      console.log(`\n  Renamed game: "${currentSpecDisp}" → "${targetDisp}"`);
    }

    console.log(`\n  Updated spec, specRef, and bets (${betCount} bets)`);

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
