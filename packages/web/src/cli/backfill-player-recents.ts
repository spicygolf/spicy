#!/usr/bin/env bun

/**
 * Backfill Player Recents
 *
 * Populates the recentPlayers list from games since 2026-02-13,
 * excluding "Big Game Test - 48".
 *
 * Usage:
 *   bun run packages/web/src/cli/backfill-player-recents.ts --account <accountId>
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { type ID } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import {
  FavoritePlayer,
  ListOfFavoritePlayers,
  PlayerAccount,
} from "spicylib/schema";

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

const CUTOFF_DATE = new Date("2026-02-13");
const EXCLUDED_GAME_NAME = "Big Game Test - 48";

// Parse args
const accountIdx = process.argv.indexOf("--account");
const accountId =
  accountIdx >= 0 ? process.argv[accountIdx + 1] : undefined;

if (!accountId) {
  console.error("Usage: bun run backfill-player-recents.ts --account <accountId>");
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`\nBackfilling player recents for account ${accountId}...\n`);

  const { worker, done } = await startWorker({
    AccountSchema: PlayerAccount,
    syncServer: `wss://cloud.jazz.tools/?key=${JAZZ_API_KEY}`,
    accountID: JAZZ_WORKER_ACCOUNT!,
    accountSecret: JAZZ_WORKER_SECRET!,
  });

  try {
    const account = await PlayerAccount.load(
      accountId as ID<typeof PlayerAccount>,
      {
        loadAs: worker,
        resolve: {
          root: {
            games: {
              $each: {
                players: { $each: true },
              },
            },
            favorites: {
              recentPlayers: { $each: { player: true } },
            },
          },
        },
      },
    );

    if (!account?.$isLoaded || !account.root?.$isLoaded) {
      console.error("Could not load account");
      await done();
      process.exit(1);
    }

    const root = account.root;
    if (!root.games?.$isLoaded) {
      console.error("Could not load games");
      await done();
      process.exit(1);
    }

    if (!root.favorites?.$isLoaded) {
      console.error("Could not load favorites");
      await done();
      process.exit(1);
    }

    const favorites = root.favorites;

    // Initialize recentPlayers list if needed
    if (!favorites.$jazz.has("recentPlayers")) {
      favorites.$jazz.set(
        "recentPlayers",
        ListOfFavoritePlayers.create([], { owner: favorites.$jazz.owner }),
      );
      // Wait for sync
      await new Promise((r) => setTimeout(r, 500));
    }

    const recentPlayers = favorites.recentPlayers;
    if (!recentPlayers?.$isLoaded) {
      console.error("Could not load recentPlayers list");
      await done();
      process.exit(1);
    }

    // Build map of player ID -> most recent game date
    const playerLastUsed = new Map<string, Date>();
    let gamesProcessed = 0;
    const games = [...root.games];

    for (const game of games) {
      if (!game?.$isLoaded) continue;
      if (!game.start || game.start < CUTOFF_DATE) continue;
      if (game.name === EXCLUDED_GAME_NAME) continue;
      if (!game.players?.$isLoaded) continue;

      gamesProcessed++;
      console.log(`  Game: ${game.name} (${game.start.toLocaleDateString()})`);

      for (const player of [...game.players]) {
        if (!player?.$isLoaded) continue;
        const id = player.$jazz.id;
        const existing = playerLastUsed.get(id);
        if (!existing || game.start > existing) {
          playerLastUsed.set(id, game.start);
        }
      }
    }

    console.log(`\nProcessed ${gamesProcessed} games, found ${playerLastUsed.size} unique players\n`);

    // Upsert into recentPlayers
    let playersAdded = 0;
    let playersUpdated = 0;

    for (const [playerId, lastUsedAt] of playerLastUsed) {
      const existing = [...recentPlayers].find(
        (fp) =>
          fp?.$isLoaded &&
          fp.player?.$isLoaded &&
          fp.player.$jazz.id === playerId,
      );

      if (existing?.$isLoaded) {
        if (!existing.lastUsedAt || lastUsedAt > existing.lastUsedAt) {
          existing.$jazz.set("lastUsedAt", lastUsedAt);
          playersUpdated++;
          console.log(`  Updated: ${existing.player?.$isLoaded ? existing.player.name : playerId}`);
        }
      } else {
        // Find the player reference from any game
        // biome-ignore lint/suspicious/noExplicitAny: Jazz list item types
        let playerRef: any = null;
        for (const game of games) {
          if (!game?.$isLoaded || !game.players?.$isLoaded) continue;
          const found = [...game.players].find(
            // biome-ignore lint/suspicious/noExplicitAny: Jazz list item types
            (p: any) => p?.$isLoaded && p.$jazz.id === playerId,
          );
          if (found?.$isLoaded) {
            playerRef = found;
            break;
          }
        }

        if (playerRef) {
          recentPlayers.$jazz.push(
            FavoritePlayer.create(
              {
                player: playerRef,
                addedAt: new Date(),
                lastUsedAt,
              },
              { owner: recentPlayers.$jazz.owner },
            ),
          );
          playersAdded++;
          console.log(`  Added: ${playerRef.name}`);
        }
      }
    }

    console.log(`\nDone! Added: ${playersAdded}, Updated: ${playersUpdated}`);

    // Give Jazz time to sync
    await new Promise((r) => setTimeout(r, 2000));
    await done();
  } catch (error) {
    console.error("Error:", error);
    await done();
    process.exit(1);
  }
}

main();
