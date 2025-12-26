#!/usr/bin/env bun
/**
 * Jazz CoValue Inspector CLI
 *
 * A generic script for inspecting Jazz CoValues directly from the command line.
 *
 * Usage:
 *   bun run jazz <coValueId> [resolveQuery]
 *
 * Examples:
 *   bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi
 *   bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi '{"rounds":{"$each":true}}'
 *   bun run jazz co_zcV2u7TYMeAMMBm4zmKe874WJPU '{}'
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { CoMap, CoList, type ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import { PlayerAccount } from "spicylib/schema";

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

function printValue(value: unknown, indent = 0): void {
  const pad = "  ".repeat(indent);

  if (value === null) {
    console.log(`${pad}null`);
    return;
  }

  if (value === undefined) {
    console.log(`${pad}undefined`);
    return;
  }

  if (typeof value !== "object") {
    console.log(`${pad}${JSON.stringify(value)}`);
    return;
  }

  // Check if it's a Jazz CoValue
  const obj = value as Record<string, unknown>;

  if ("$jazz" in obj) {
    const jazz = obj.$jazz as Record<string, unknown>;
    const isLoaded = obj.$isLoaded as boolean;
    const id = jazz.id as string;
    const loadingState = jazz.loadingState;

    console.log(`${pad}[CoValue ${id}]`);
    console.log(`${pad}  $isLoaded: ${isLoaded}`);
    if (loadingState !== undefined) {
      console.log(`${pad}  $jazz.loadingState: ${loadingState}`);
    }

    if (!isLoaded) {
      return;
    }

    // Print all non-$ keys
    const keys = Object.keys(obj).filter((k) => !k.startsWith("$"));
    console.log(`${pad}  keys: ${JSON.stringify(keys)}`);

    for (const key of keys) {
      const val = obj[key];
      // Call has() with proper this binding
      let has: boolean | string = "N/A";
      try {
        if (typeof jazz.has === "function") {
          has = (jazz.has as (key: string) => boolean).call(jazz, key);
        }
      } catch {
        has = "error";
      }

      if (val && typeof val === "object" && "$jazz" in val) {
        // Nested CoValue - recurse
        console.log(`${pad}  ${key}: (has=${has})`);
        printValue(val, indent + 2);
      } else if (Array.isArray(val)) {
        console.log(`${pad}  ${key}: (has=${has}) Array[${val.length}]`);
        for (let i = 0; i < val.length; i++) {
          console.log(`${pad}    [${i}]:`);
          printValue(val[i], indent + 3);
        }
      } else {
        console.log(
          `${pad}  ${key}: ${JSON.stringify(val)} (has=${has}, type=${typeof val})`,
        );
      }
    }
  } else if (Array.isArray(value)) {
    console.log(`${pad}Array[${value.length}]`);
    for (let i = 0; i < value.length; i++) {
      console.log(`${pad}  [${i}]:`);
      printValue(value[i], indent + 2);
    }
  } else {
    // Plain object
    console.log(`${pad}${JSON.stringify(value)}`);
  }
}

async function inspect(coValueId: string, resolveQuery: string): Promise<void> {
  console.log(`\nInspecting: ${coValueId}`);
  console.log(`Resolve: ${resolveQuery}\n`);

  const { worker, done } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT,
    accountSecret: JAZZ_WORKER_SECRET,
  });

  try {
    const resolveObj = JSON.parse(resolveQuery);

    // Try loading as generic CoMap first
    const loadedMap = await CoMap.load(coValueId as ID<CoMap>, {
      loadAs: worker,
      resolve: resolveObj,
    });

    if (loadedMap?.$isLoaded) {
      printValue(loadedMap);
      await done();
      return;
    }

    // Try as CoList
    const loadedList = await CoList.load(coValueId as ID<CoList>, {
      loadAs: worker,
      resolve: resolveObj,
    });

    if (loadedList?.$isLoaded) {
      printValue(loadedList);
      await done();
      return;
    }

    console.error("CoValue not found or not accessible");
  } catch (error) {
    console.error("Error:", error);
  }

  await done();
}

// Main CLI
const [coValueId, resolveQuery = "{}"] = process.argv.slice(2);

if (!coValueId || !coValueId.startsWith("co_")) {
  console.log(`
Jazz CoValue Inspector

Usage:
  bun run jazz <coValueId> [resolveQuery]

Arguments:
  coValueId     Jazz CoValue ID (starts with co_)
  resolveQuery  JSON resolve query (default: {})

Examples:
  bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi
  bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi '{}'
  bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi '{"rounds":{"$each":true}}'
  bun run jazz co_zcV2u7TYMeAMMBm4zmKe874WJPU '{"round":{"tee":true}}'
`);
  process.exit(1);
}

await inspect(coValueId, resolveQuery);
