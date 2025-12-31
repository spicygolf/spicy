#!/usr/bin/env bun
/**
 * Jazz CoValue Inspector CLI
 *
 * Inspects Jazz CoValues using typed schemas for proper field access.
 *
 * Usage:
 *   bun run jazz <coValueId> [resolveQuery]
 *   bun run jazz <type> <coValueId> [resolveQuery]
 *
 * Types: player, game, round, course, tee, spec, account
 *
 * Examples:
 *   bun run jazz player co_zndRVBmTsDPNdjNiauVfUQaMFLV
 *   bun run jazz game co_zeGX6eUyGPUbMPdV9csYsnFczib '{"players":{"$each":true}}'
 *   bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi  # Auto-detect type
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import type { ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import {
  Course,
  Game,
  GameSpec,
  Player,
  PlayerAccount,
  Round,
  RoundToGame,
  Tee,
} from "spicylib/schema";

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

// Schema type mapping
const SCHEMAS = {
  player: Player,
  game: Game,
  round: Round,
  roundtogame: RoundToGame,
  course: Course,
  tee: Tee,
  spec: GameSpec,
  gamespec: GameSpec,
  account: PlayerAccount,
} as const;

type SchemaType = keyof typeof SCHEMAS;

function printValue(
  value: unknown,
  indent = 0,
  seen = new Set<string>(),
): void {
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

    // Prevent infinite recursion on circular refs
    if (seen.has(id)) {
      console.log(`${pad}[CoValue ${id}] (already printed)`);
      return;
    }
    seen.add(id);

    console.log(`${pad}[CoValue ${id}]`);

    if (!isLoaded) {
      console.log(`${pad}  (not loaded)`);
      return;
    }

    // Get all enumerable keys that aren't Jazz internals
    const keys = Object.keys(obj).filter(
      (k) => !k.startsWith("$") && k !== "_schema",
    );

    for (const key of keys) {
      const val = obj[key];

      if (val && typeof val === "object" && "$jazz" in val) {
        // Nested CoValue
        const nestedId = (val as { $jazz: { id: string } }).$jazz.id;
        const nestedLoaded = (val as unknown as { $isLoaded: boolean })
          .$isLoaded;
        if (nestedLoaded) {
          console.log(`${pad}  ${key}:`);
          printValue(val, indent + 2, seen);
        } else {
          console.log(`${pad}  ${key}: [ref ${nestedId}] (not loaded)`);
        }
      } else if (Array.isArray(val)) {
        console.log(`${pad}  ${key}: Array[${val.length}]`);
        const maxItems = 10;
        for (let i = 0; i < Math.min(val.length, maxItems); i++) {
          const item = val[i];
          if (item && typeof item === "object" && "$jazz" in item) {
            const itemId = (item as { $jazz: { id: string } }).$jazz.id;
            const itemLoaded = (item as { $isLoaded: boolean }).$isLoaded;
            if (itemLoaded) {
              console.log(`${pad}    [${i}]:`);
              printValue(item, indent + 3, seen);
            } else {
              console.log(`${pad}    [${i}]: [ref ${itemId}] (not loaded)`);
            }
          } else {
            console.log(`${pad}    [${i}]: ${JSON.stringify(item)}`);
          }
        }
        if (val.length > maxItems) {
          console.log(`${pad}    ... and ${val.length - maxItems} more`);
        }
      } else if (val && typeof val === "object") {
        // Plain object (like ratings, season, etc.)
        console.log(`${pad}  ${key}: ${JSON.stringify(val)}`);
      } else {
        console.log(`${pad}  ${key}: ${JSON.stringify(val)}`);
      }
    }
  } else if (Array.isArray(value)) {
    console.log(`${pad}Array[${value.length}]`);
    for (let i = 0; i < Math.min(value.length, 10); i++) {
      console.log(`${pad}  [${i}]:`);
      printValue(value[i], indent + 2, seen);
    }
  } else {
    console.log(`${pad}${JSON.stringify(value)}`);
  }
}

async function inspect(
  schemaType: SchemaType | null,
  coValueId: string,
  resolveQuery: string,
): Promise<void> {
  console.log(`\nInspecting: ${coValueId}`);
  if (schemaType) {
    console.log(`Type: ${schemaType}`);
  }
  console.log(`Resolve: ${resolveQuery}\n`);

  const { worker, done } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT,
    accountSecret: JAZZ_WORKER_SECRET,
  });

  try {
    const resolveObj = JSON.parse(resolveQuery);

    // If schema type specified, use it directly
    if (schemaType && schemaType in SCHEMAS) {
      const Schema = SCHEMAS[schemaType];
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema loading
      const loaded = await (Schema as any).load(coValueId as ID<any>, {
        loadAs: worker,
        resolve: resolveObj,
      });

      if (loaded?.$isLoaded) {
        printValue(loaded);
        await done();
        return;
      }
      console.error(`Could not load as ${schemaType}`);
      await done();
      return;
    }

    // Auto-detect: try each schema
    // Order matters! More specific schemas (with more required fields) should come first
    // to avoid false positives. E.g., tee has name+gender+holes, player has name+gender,
    // so tee must be checked first or it would match as player.
    const schemasToTry: SchemaType[] = [
      "tee", // has name, gender, holes - check before player
      "course", // has name, city, tees
      "game", // has start, players
      "round", // has createdAt, playerId
      "roundtogame", // has round, handicapIndex
      "spec", // has name, spec_type
      "player", // has name, gender (least specific with those fields)
      "account", // has root or profile
    ];

    for (const type of schemasToTry) {
      try {
        const Schema = SCHEMAS[type];
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic schema loading
        const loaded = await (Schema as any).load(coValueId as ID<any>, {
          loadAs: worker,
          resolve: resolveObj,
        });

        if (loaded?.$isLoaded) {
          // Check if it has expected fields for this type
          const hasExpectedFields = checkSchemaMatch(loaded, type);
          if (hasExpectedFields) {
            console.log(`Detected type: ${type}\n`);
            printValue(loaded);
            await done();
            return;
          }
        }
      } catch {
        // Try next schema
      }
    }

    console.error("Could not load CoValue with any known schema.");
    console.error("Try specifying a type: bun run jazz <type> <id>");
  } catch (error) {
    console.error("Error:", error);
  }

  await done();
}

function checkSchemaMatch(obj: unknown, type: SchemaType): boolean {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;

  switch (type) {
    case "player":
      // Player has name, gender, short - and does NOT have holes (which tee has)
      return "name" in o && "gender" in o && "short" in o && !("holes" in o);
    case "game":
      return "start" in o && "players" in o;
    case "round":
      return "createdAt" in o && "playerId" in o;
    case "roundtogame":
      return "round" in o && "handicapIndex" in o;
    case "course":
      return "name" in o && "city" in o && "tees" in o;
    case "tee":
      return "name" in o && "gender" in o && "holes" in o;
    case "spec":
    case "gamespec":
      return "name" in o && "spec_type" in o;
    case "account":
      return "root" in o || "profile" in o;
    default:
      return false;
  }
}

// Parse CLI args
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Jazz CoValue Inspector

Usage:
  bun run jazz <coValueId> [resolveQuery]
  bun run jazz <type> <coValueId> [resolveQuery]

Types:
  player, game, round, roundtogame, course, tee, spec, account

Arguments:
  coValueId     Jazz CoValue ID (starts with co_)
  resolveQuery  JSON resolve query (default: {})

Examples:
  bun run jazz player co_zndRVBmTsDPNdjNiauVfUQaMFLV
  bun run jazz player co_zndRVBmTsDPNdjNiauVfUQaMFLV '{"rounds":{"$each":true}}'
  bun run jazz game co_zeGX6eUyGPUbMPdV9csYsnFczib '{"players":{"$each":true}}'
  bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi  # Auto-detect type
`);
  process.exit(1);
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(): {
  schemaType: SchemaType | null;
  coValueId: string;
  resolveQuery: string;
} {
  let schemaType: SchemaType | null = null;
  let coValueId: string | undefined;
  let resolveQuery = "{}";

  const firstArg = args[0];
  if (!firstArg) {
    exitWithError("No arguments provided");
  }

  // Check if first arg is a type or a coValueId
  if (firstArg in SCHEMAS) {
    schemaType = firstArg as SchemaType;
    coValueId = args[1];
    resolveQuery = args[2] || "{}";
  } else if (firstArg.startsWith("co_")) {
    coValueId = firstArg;
    resolveQuery = args[1] || "{}";
  } else {
    exitWithError(
      `Invalid argument: ${firstArg}\nFirst argument must be a type or coValueId starting with "co_"`,
    );
  }

  if (!coValueId || !coValueId.startsWith("co_")) {
    exitWithError(`Invalid coValueId: ${coValueId}`);
  }

  return { schemaType, coValueId, resolveQuery };
}

const { schemaType, coValueId, resolveQuery } = parseArgs();

await inspect(schemaType, coValueId, resolveQuery);
