/**
 * Check v0.3 games for option overrides
 */

import { createArangoConnection } from "../utils/arango";

async function checkGameOptions() {
  const db = createArangoConnection();

  try {
    // Query to find games with options
    const cursor = await db.query(`
      FOR game IN games
        FILTER game.options != null AND LENGTH(game.options) > 0
        LIMIT 5
        RETURN {
          key: game._key,
          name: game.name,
          options: game.options
        }
    `);

    const games = await cursor.all();

    console.log(`Found ${games.length} games with options:\n`);

    for (const game of games) {
      console.log(`Game: ${game.name} (${game.key})`);
      console.log("Options:", JSON.stringify(game.options, null, 2));
      console.log("");
    }

    // Check for games with hole-level option overrides (options with "values" array)
    const holeLevelCursor = await db.query(`
      FOR game IN games
        FILTER game.options != null AND LENGTH(game.options) > 0
        LET holeLevelOptions = (
          FOR opt IN game.options
            FILTER opt.values != null
            RETURN opt
        )
        FILTER LENGTH(holeLevelOptions) > 0
        LIMIT 5
        RETURN {
          key: game._key,
          name: game.name,
          holeLevelOptions: holeLevelOptions
        }
    `);

    const gamesWithHoleLevelOptions = await holeLevelCursor.all();

    console.log("\n=== Games with hole-level option overrides ===\n");
    console.log(`Found ${gamesWithHoleLevelOptions.length} games:\n`);

    for (const game of gamesWithHoleLevelOptions) {
      console.log(`Game: ${game.name} (${game.key})`);
      console.log(
        "Hole-level options:",
        JSON.stringify(game.holeLevelOptions, null, 2),
      );
      console.log("");
    }
  } catch (error) {
    console.error("Error checking game options:", error);
  }
}

checkGameOptions();
