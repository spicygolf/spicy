#!/usr/bin/env bun

/**
 * Add Options to Game and GameSpec
 *
 * Adds new multiplier options (twelve, custom) to a game's spec options map.
 *
 * Usage:
 *   bun run src/cli/add-options-to-game.ts <gameId>
 *
 * Example:
 *   bun run src/cli/add-options-to-game.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import type { Account, ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { Game, MapOfOptions, MultiplierOption } from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";

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

// New multiplier options to add
const TWELVE_OPTION = {
  name: "twelve",
  disp: "12x",
  type: "multiplier" as const,
  version: "0.5",
  value: 12,
  seq: 6,
  icon: "album",
  based_on: "user",
  scope: "hole" as const,
  override: true,
  availability: JSON.stringify({
    and: [
      { team_down_the_most: [{ getPrevHole: [] }, { var: "team" }] },
      { existingPreMultiplierTotal: [{ getCurrHole: [] }, 8] },
    ],
  }),
};

const CUSTOM_OPTION = {
  name: "custom",
  disp: "Custom",
  type: "multiplier" as const,
  version: "0.5",
  value: 0, // Will be set by user input via input_value
  seq: 7,
  icon: "sliders",
  based_on: "user",
  scope: "none" as const, // Not shown on team buttons - activated from hole toolbar
  override: true,
  input_value: true, // Value comes from user input stored in TeamOption.value
  availability: JSON.stringify({
    team_down_the_most: [{ getPrevHole: [] }, { var: "team" }],
  }),
};

type MultiplierScope =
  | "player"
  | "team"
  | "hole"
  | "rest_of_nine"
  | "game"
  | "none";

interface MultiplierOptionDef {
  name: string;
  disp: string;
  type: "multiplier";
  version: string;
  value: number;
  seq?: number;
  icon?: string;
  based_on?: string;
  scope?: MultiplierScope;
  availability?: string;
  override?: boolean;
  value_from?: string;
  input_value?: boolean;
}

async function addMultiplierOption(
  optionsMap: MapOfOptions,
  optionDef: MultiplierOptionDef,
): Promise<boolean> {
  const existing = optionsMap[optionDef.name];
  if (existing?.$isLoaded) {
    console.log(`  Option "${optionDef.name}" already exists, skipping`);
    return false;
  }

  const newOption = MultiplierOption.create(
    {
      name: optionDef.name,
      disp: optionDef.disp,
      type: "multiplier",
      version: optionDef.version,
      value: optionDef.value,
    },
    { owner: optionsMap.$jazz.owner },
  );

  // Set optional fields
  if (optionDef.seq !== undefined) {
    newOption.$jazz.set("seq", optionDef.seq);
  }
  if (optionDef.icon) {
    newOption.$jazz.set("icon", optionDef.icon);
  }
  if (optionDef.based_on) {
    newOption.$jazz.set("based_on", optionDef.based_on);
  }
  if (optionDef.scope) {
    newOption.$jazz.set("scope", optionDef.scope);
  }
  if (optionDef.availability) {
    newOption.$jazz.set("availability", optionDef.availability);
  }
  if (optionDef.override !== undefined) {
    newOption.$jazz.set("override", optionDef.override);
  }
  if (optionDef.value_from) {
    newOption.$jazz.set("value_from", optionDef.value_from);
  }
  if (optionDef.input_value !== undefined) {
    newOption.$jazz.set("input_value", optionDef.input_value);
  }

  optionsMap.$jazz.set(optionDef.name, newOption);
  console.log(`  Added option "${optionDef.name}"`);
  return true;
}

async function main() {
  const [gameId] = process.argv.slice(2);

  if (!gameId) {
    console.log("Usage: bun run src/cli/add-options-to-game.ts <gameId>");
    console.log("\nExample:");
    console.log(
      "  bun run src/cli/add-options-to-game.ts co_zJkF8xhjVFRNemoSdXZnZrUtHM2",
    );
    process.exit(1);
  }

  console.log(`\nAdding twelve and custom multipliers to game`);
  console.log(`  Game: ${gameId}`);

  // Start worker
  await startWorker({
    accountID: JAZZ_WORKER_ACCOUNT as ID<Account>,
    accountSecret: JAZZ_WORKER_SECRET,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
  });

  try {
    // Load the game with specs - GameSpec IS the options map, so resolve with $each
    const game = await Game.load(gameId as ID<Game>, {
      resolve: {
        specs: {
          $each: { $each: true },
        },
      },
    });

    if (!game?.$isLoaded) {
      console.error(`Failed to load game: ${gameId}`);
      process.exit(1);
    }

    console.log(`\nGame: ${game.name}`);

    const spec = game.specRef;
    if (!spec?.$isLoaded) {
      console.error("Game has no spec loaded");
      process.exit(1);
    }

    const specName = getSpecField(spec, "name");
    console.log(`Spec: ${specName} (${spec.$jazz.id})`);

    // GameSpec IS the options map directly - no need to check for nested options
    console.log(
      `\nCurrent options: ${Object.keys(spec).filter((k) => !k.startsWith("$")).length}`,
    );
    console.log(
      `  ${Object.keys(spec)
        .filter((k) => !k.startsWith("$"))
        .join(", ")}`,
    );

    // Add new multiplier options - spec IS the options map
    console.log("\nAdding new multiplier options to spec:");
    const addedTwelve = await addMultiplierOption(spec, TWELVE_OPTION);
    const addedCustom = await addMultiplierOption(spec, CUSTOM_OPTION);

    if (!addedTwelve && !addedCustom) {
      console.log("\nNo new options added (all already exist)");
    } else {
      console.log(
        `\nUpdated options: ${Object.keys(spec).filter((k) => !k.startsWith("$")).length}`,
      );
      console.log(
        `  ${Object.keys(spec)
          .filter((k) => !k.startsWith("$"))
          .join(", ")}`,
      );
    }

    // Wait for sync
    console.log("\nSyncing...");
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
