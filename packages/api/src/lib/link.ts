/**
 * Player Linking Utilities
 *
 * Functions for linking imported players to user accounts,
 * granting access to games, and importing favorites.
 */

import type { co, Group } from "jazz-tools";
import { Game, Player, type PlayerAccount } from "spicylib/schema";
import { loadPlayerFavorites } from "../utils/favorites-file";
import { getGamesForPlayer } from "../utils/games-file";
import { importFavoritesForPlayer, loadOrCreateCatalog } from "./catalog";

/**
 * Result of looking up a player (preview, no modifications)
 */
export interface PlayerLookupResult {
  found: boolean;
  playerId?: string;
  playerName?: string;
  ghinId?: string;
  legacyId?: string;
  /** Number of games found for this player */
  gameCount: number;
  /** Number of favorite players available */
  favoritePlayersCount: number;
  /** Number of favorite course/tees available */
  favoriteCoursesCount: number;
}

/**
 * Result of linking a player to a user account
 */
export interface LinkPlayerResult {
  success: boolean;
  playerId: string;
  playerName: string;
  gameIds: string[];
  favorites: {
    players: number;
    courseTees: number;
    errors: string[];
  };
  message: string;
}

/**
 * Look up a player by GHIN ID and return preview data
 *
 * This is a read-only operation that does not modify any data.
 * Use this to show the user what data is available before they confirm import.
 *
 * @param ghinId - The GHIN ID to look up
 * @param workerAccount - The worker account that owns the catalog
 * @returns PlayerLookupResult with preview of available data
 */
export async function lookupPlayer(
  ghinId: string,
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<PlayerLookupResult> {
  console.log(`Looking up player with GHIN ${ghinId} (preview only)`);

  // Load the catalog
  const catalog = await loadOrCreateCatalog(workerAccount);

  // Ensure players map is loaded
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { players: {} },
  });

  if (!loadedCatalog.players) {
    return {
      found: false,
      gameCount: 0,
      favoritePlayersCount: 0,
      favoriteCoursesCount: 0,
    };
  }

  const catalogPlayers = loadedCatalog.players;
  const playerRef = catalogPlayers[ghinId];

  if (!playerRef) {
    return {
      found: false,
      gameCount: 0,
      favoritePlayersCount: 0,
      favoriteCoursesCount: 0,
    };
  }

  // Load player to get details
  const playerId = playerRef.$jazz.id;
  const loadedPlayer = await Player.load(playerId, {});

  if (!loadedPlayer?.$isLoaded) {
    return {
      found: false,
      gameCount: 0,
      favoritePlayersCount: 0,
      favoriteCoursesCount: 0,
    };
  }

  const playerName = loadedPlayer.name;
  const legacyPlayerId = loadedPlayer.legacyId;

  // Count games from file index (fast, no need to load each game)
  let gameCount = 0;
  if (legacyPlayerId) {
    const gameIds = await getGamesForPlayer(legacyPlayerId);
    gameCount = gameIds.length;
  }

  // Count favorites from file (fast, no need to process)
  let favoritePlayersCount = 0;
  let favoriteCoursesCount = 0;
  if (legacyPlayerId) {
    const favorites = await loadPlayerFavorites(legacyPlayerId);
    if (favorites) {
      favoritePlayersCount = favorites.favoritePlayers.length;
      favoriteCoursesCount = favorites.favoriteCourseTees.length;
    }
  }

  console.log(
    `Found player ${playerName}: ${gameCount} games, ${favoritePlayersCount} favorite players, ${favoriteCoursesCount} favorite courses`,
  );

  return {
    found: true,
    playerId,
    playerName,
    ghinId,
    legacyId: legacyPlayerId,
    gameCount,
    favoritePlayersCount,
    favoriteCoursesCount,
  };
}

/**
 * Link an imported player to a user account by GHIN ID
 *
 * This function:
 * 1. Finds the player in the catalog by GHIN ID
 * 2. Adds the user to the player's owner group
 * 3. Finds all games the player participated in and grants access
 * 4. Sets root.player on the user's account
 * 5. Imports the player's favorites from ArangoDB
 *
 * @param userAccount - The user's loaded PlayerAccount
 * @param ghinId - The GHIN ID to look up
 * @param workerAccount - The worker account that owns the catalog
 * @param userEmail - The user's email (for logging)
 * @returns LinkPlayerResult with details of what was linked
 */
export async function linkPlayerToUser(
  userAccount: co.loaded<typeof PlayerAccount>,
  ghinId: string,
  workerAccount: co.loaded<typeof PlayerAccount>,
  userEmail: string,
): Promise<LinkPlayerResult> {
  console.log(
    `Looking for player with GHIN ${ghinId} owned by worker ${workerAccount.$jazz.id}`,
  );

  // Load the catalog
  const catalog = await loadOrCreateCatalog(workerAccount);

  // Ensure players map is loaded
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { players: {} },
  });

  if (!loadedCatalog.players) {
    throw new Error(
      "Catalog players not initialized. Please run player import first.",
    );
  }

  const catalogPlayers = loadedCatalog.players;
  const playerRef = catalogPlayers[ghinId];

  if (!playerRef) {
    throw new Error(
      `Player with GHIN ID ${ghinId} not found. Have you run the import?`,
    );
  }

  // Get player ID and load it properly using Player.load()
  const playerId = playerRef.$jazz.id;
  const loadedPlayer = await Player.load(playerId, {});

  if (!loadedPlayer?.$isLoaded) {
    throw new Error(`Failed to load player ${ghinId}`);
  }

  const playerName = loadedPlayer.name;
  const legacyPlayerId = loadedPlayer.legacyId;

  console.log(
    `Found player ${ghinId} in catalog: ${playerId} (legacy: ${legacyPlayerId}). Adding user ${userEmail} to owner group...`,
  );

  // Add user to the player's owner group so they can access it
  const playerOwner = loadedPlayer.$jazz.owner;

  if (
    playerOwner &&
    typeof playerOwner === "object" &&
    "addMember" in playerOwner
  ) {
    (playerOwner as Group).addMember(userAccount, "admin");
    console.log(`Added ${userEmail} as admin to player owner group`);
  } else {
    console.warn("Player owner is not a group, cannot add user");
  }

  // Find all games that this player participated in and grant access
  const gameIds: string[] = [];

  // Ensure catalog.games is loaded
  const catalogWithGames = await loadedCatalog.$jazz.ensureLoaded({
    resolve: { games: {} },
  });

  if (catalogWithGames.games) {
    console.log(`Searching for games with player ${playerId}...`);

    // Iterate through all games in the catalog
    for (const [legacyId, gameRef] of Object.entries(catalogWithGames.games)) {
      // Load the game to check its players list
      const gameId = gameRef.$jazz.id;
      const loadedGame = await Game.load(gameId, {
        resolve: { players: true },
      });

      if (!loadedGame?.$isLoaded) {
        console.warn(`Game ${legacyId} failed to load, skipping`);
        continue;
      }

      // Check if this player is in the game's players list
      if (loadedGame.players?.$isLoaded) {
        for (const player of loadedGame.players as Iterable<
          (typeof loadedGame.players)[number]
        >) {
          if (player?.$isLoaded && player.$jazz.id === playerId) {
            console.log(`Found player in game ${legacyId}`);
            gameIds.push(loadedGame.$jazz.id);

            // Add user to the game's owner group so they can access it
            const gameOwner = loadedGame.$jazz.owner;

            if (
              gameOwner &&
              typeof gameOwner === "object" &&
              "addMember" in gameOwner
            ) {
              (gameOwner as Group).addMember(userAccount, "admin");
              console.log(`Added ${userEmail} to game ${legacyId} owner group`);
            }

            break; // Player found in this game, move to next game
          }
        }
      }
    }

    console.log(`Found ${gameIds.length} games for player ${playerId}`);
  }

  // Import favorites for this player
  let favoritesResult = {
    favoritePlayers: 0,
    favoriteCourseTees: 0,
    errors: [] as string[],
  };

  // Load userAccount.root to set the player and import favorites
  const loadedUserAccount = await userAccount.$jazz.ensureLoaded({
    resolve: { root: true },
  });

  if (!loadedUserAccount.root?.$isLoaded) {
    throw new Error("User account root not loaded");
  }

  // Set root.player so the web app can access it
  loadedUserAccount.root.$jazz.set("player", loadedPlayer);
  console.log(`Set root.player to ${playerName}`);

  // Import favorites using the legacyId
  console.log(
    `[linkPlayerToUser] About to import favorites. legacyPlayerId=${legacyPlayerId}`,
  );
  if (legacyPlayerId) {
    console.log(
      `[linkPlayerToUser] Calling importFavoritesForPlayer for ${legacyPlayerId}...`,
    );
    const catalogId = catalog.$jazz.id;
    console.log(
      `[linkPlayerToUser] Calling with userAccount.id=${userAccount.$jazz.id}, catalogId=${catalogId}`,
    );
    favoritesResult = await importFavoritesForPlayer(
      userAccount,
      legacyPlayerId,
      catalogId,
      workerAccount,
    );
    console.log(
      `[linkPlayerToUser] Favorites imported: ${favoritesResult.favoritePlayers} players, ${favoritesResult.favoriteCourseTees} course/tees`,
    );
    if (favoritesResult.errors.length > 0) {
      console.error(
        `[linkPlayerToUser] Favorites import errors:`,
        favoritesResult.errors,
      );
    }
  } else {
    console.warn(
      "[linkPlayerToUser] No legacyId found for player, skipping favorites import",
    );
  }

  return {
    success: true,
    playerId: playerId,
    playerName: playerName,
    gameIds: gameIds,
    favorites: {
      players: favoritesResult.favoritePlayers,
      courseTees: favoritesResult.favoriteCourseTees,
      errors: favoritesResult.errors,
    },
    message: `Added you to player group and ${gameIds.length} game(s). Imported ${favoritesResult.favoritePlayers} favorite players and ${favoritesResult.favoriteCourseTees} favorite course/tees.`,
  };
}
