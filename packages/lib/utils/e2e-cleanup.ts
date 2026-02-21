/**
 * E2E Test Cleanup Utilities
 *
 * DEV/TEST ONLY - These functions provide deep cleanup of game data
 * to minimize Jazz orphans during E2E testing and CLI scripts.
 *
 * Jazz does NOT support explicit deletion of CoValues. When we splice/clear a list,
 * items become orphaned (unreferenced but still in storage). These utilities
 * clear nested data structures first, leaving orphaned CoValues as "empty shells"
 * rather than full data trees.
 */

declare const __DEV__: boolean | undefined;

import type { Game, ListOfGames, Player } from "spicylib/schema";

/**
 * Deep delete a game and all its related data.
 *
 * Properly cleans up (in order):
 * 1. Team options and round-to-team edges within each hole
 * 2. Teams within each hole
 * 3. Holes list
 * 4. Round scores
 * 5. RoundToGame edges
 * 6. Players list
 *
 * @param game - The game to deep delete (will be fully loaded)
 * @throws Error if called in production builds (when __DEV__ is defined and false)
 */
export async function deepDeleteGame(game: Game): Promise<void> {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    throw new Error("deepDeleteGame is only available in development builds");
  }

  // Tombstone: prevents scoring re-computation while we clear nested data
  game.$jazz.set("deleted", true);

  // Ensure game is fully loaded with all nested data
  const loadedGame = await game.$jazz.ensureLoaded({
    resolve: {
      holes: { $each: { teams: { $each: { rounds: true, options: true } } } },
      rounds: { $each: { round: { scores: true } } },
      players: true,
    },
  });

  // 1. Clear all teams from all holes (bottom-up approach)
  if (loadedGame.holes?.$isLoaded) {
    // biome-ignore lint/suspicious/noExplicitAny: Jazz resolved types need type assertion for mutations
    const holes = loadedGame.holes as any;
    for (let holeIdx = 0; holeIdx < holes.length; holeIdx++) {
      const hole = holes[holeIdx];
      if (!hole?.$isLoaded || !hole.teams?.$isLoaded) continue;

      for (let teamIdx = 0; teamIdx < hole.teams.length; teamIdx++) {
        const team = hole.teams[teamIdx];
        if (!team?.$isLoaded) continue;

        // Clear team options if present
        if (team.$jazz.has("options") && team.options?.$isLoaded) {
          team.options.$jazz.splice(0, team.options.length);
        }

        // Clear round-to-team edges
        if (team.rounds?.$isLoaded) {
          team.rounds.$jazz.splice(0, team.rounds.length);
        }
      }

      // Clear teams list for this hole
      hole.teams.$jazz.splice(0, hole.teams.length);
    }

    // Clear holes list
    holes.$jazz.splice(0, holes.length);
  }

  // 2. Clear rounds and their scores
  if (loadedGame.rounds?.$isLoaded) {
    // biome-ignore lint/suspicious/noExplicitAny: Jazz resolved types need type assertion for mutations
    const rounds = loadedGame.rounds as any;
    for (let rtgIdx = 0; rtgIdx < rounds.length; rtgIdx++) {
      const rtg = rounds[rtgIdx];
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

      // Clear scores for each hole
      if (rtg.round.scores?.$isLoaded) {
        for (const key of Object.keys(rtg.round.scores)) {
          // Skip Jazz internal properties
          if (!key.startsWith("$") && key !== "_refs") {
            rtg.round.scores.$jazz.delete(key);
          }
        }
      }
    }

    // Clear RoundToGame edges
    rounds.$jazz.splice(0, rounds.length);
  }

  // 3. Clear players list
  if (loadedGame.players?.$isLoaded) {
    // biome-ignore lint/suspicious/noExplicitAny: Jazz resolved types need type assertion for mutations
    const players = loadedGame.players as any;
    players.$jazz.splice(0, players.length);
  }
}

/**
 * Deep delete all games in a list.
 *
 * Iterates through all games, calling deepDeleteGame on each,
 * then clears the games list itself.
 *
 * @param games - The games list to deep delete (typically me.root.games)
 * @returns Number of games that were deleted
 * @throws Error if called in production builds (when __DEV__ is defined and false)
 */
export async function deepDeleteAllGames(games: ListOfGames): Promise<number> {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    throw new Error(
      "deepDeleteAllGames is only available in development builds",
    );
  }

  if (!games?.$isLoaded) {
    return 0;
  }

  let count = 0;

  // Process games (iterate over a copy to avoid issues during deletion)
  const gamesList = [...games];

  const errors: unknown[] = [];
  for (const game of gamesList) {
    if (game?.$isLoaded) {
      try {
        await deepDeleteGame(game);
        count++;
      } catch (err) {
        errors.push(err);
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `deepDeleteAllGames: ${errors.length} game(s) failed to delete`,
      errors,
    );
  }

  // Clear the games list itself
  // biome-ignore lint/suspicious/noExplicitAny: Jazz list type needs assertion for mutation
  (games as any).$jazz.splice(0, games.length);

  return count;
}

/**
 * Clear all rounds for a player.
 *
 * This removes all rounds from the player's rounds list, clearing scores first.
 * Used to ensure the logged-in user starts fresh in E2E tests.
 *
 * @param player - The player whose rounds should be cleared
 * @returns Number of rounds that were cleared
 * @throws Error if called in production builds (when __DEV__ is defined and false)
 */
export async function clearPlayerRounds(player: Player): Promise<number> {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    throw new Error(
      "clearPlayerRounds is only available in development builds",
    );
  }

  if (!player?.$isLoaded) {
    return 0;
  }

  // Ensure rounds are loaded with scores
  const loadedPlayer = await player.$jazz.ensureLoaded({
    resolve: {
      rounds: { $each: { scores: true } },
    },
  });

  if (!loadedPlayer.rounds?.$isLoaded) {
    return 0;
  }

  const count = loadedPlayer.rounds.length;

  // Clear scores for each round first
  // biome-ignore lint/suspicious/noExplicitAny: Jazz resolved types need type assertion for mutations
  const rounds = loadedPlayer.rounds as any;
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    if (!round?.$isLoaded) continue;

    if (round.scores?.$isLoaded) {
      for (const key of Object.keys(round.scores)) {
        if (!key.startsWith("$") && key !== "_refs") {
          round.scores.$jazz.delete(key);
        }
      }
    }
  }

  // Clear the rounds list
  rounds.$jazz.splice(0, rounds.length);

  return count;
}
