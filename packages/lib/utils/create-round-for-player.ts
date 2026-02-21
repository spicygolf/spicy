import type { Group, ID } from "jazz-tools";
import {
  type Game,
  type ListOfGames,
  type Player,
  Round,
  RoundScores,
  RoundToGame,
} from "spicylib/schema";
import { isSameDay } from "./datetime";

/** Error callback signature for platform-specific error reporting. */
export type OnError = (
  error: Error,
  options: { source: string; context?: Record<string, unknown> },
) => void;

/**
 * Gets rounds for a player on a specific date by scanning the user's games.
 *
 * Searches across all loaded games for same-date games containing rounds
 * with matching playerId. This avoids relying on player.rounds (which may
 * be owned by a catalog group the app can't write to).
 *
 * Only same-date games are deep-loaded (rounds -> round refs), keeping
 * the cost proportional to concurrent games (typically 1-2), not total games.
 *
 * @param playerId - The player's CoValue ID to match
 * @param date - The date to check for rounds
 * @param games - The user's games list (me.root.games), shallowly loaded
 * @param excludeGameId - Optional game ID to exclude from search (the current game)
 * @returns Array of rounds for this player on that date from other games
 */
export async function getRoundsForDate(
  playerId: ID<Player>,
  date: Date,
  games: ListOfGames | undefined,
  excludeGameId?: ID<Game>,
): Promise<Round[]> {
  if (!games?.$isLoaded) return [];

  // First pass: find same-date games (cheap — only checks game.start)
  const sameDateGames: Game[] = [];
  for (const game of games) {
    if (!game?.$isLoaded) continue;
    if (excludeGameId && game.$jazz.id === excludeGameId) continue;
    if (!isSameDay(game.start, date)) continue;
    sameDateGames.push(game);
  }

  if (sameDateGames.length === 0) return [];

  // Second pass: deep-load only same-date games' rounds
  const rounds: Round[] = [];
  for (const game of sameDateGames) {
    try {
      const loaded = await game.$jazz.ensureLoaded({
        resolve: { rounds: { $each: { round: true } } },
      });
      if (!loaded.rounds?.$isLoaded) continue;

      for (let i = 0; i < loaded.rounds.length; i++) {
        const rtg = loaded.rounds[i];
        if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
        if (rtg.round.playerId !== playerId) continue;
        if (!rtg.round.start) continue;
        rounds.push(rtg.round);
      }
    } catch {
      // Skip games whose rounds fail to load (permissions, corrupted data)
    }
  }

  return rounds;
}

/**
 * Creates a new round for a player and adds it to a game.
 * This is the shared logic used by both "Create New Round" button and auto-round creation.
 *
 * The round is linked to the game via RoundToGame (added to game.rounds).
 * We intentionally do NOT add the round to player.rounds — catalog-imported
 * players' rounds lists are owned by server-side groups that the app can't
 * write to (the transaction is silently invalidated by Jazz permissions).
 *
 * @param game - The game to add the round to (must be loaded with rounds and players resolved)
 * @param player - The player to create the round for (must be in game.players)
 * @param onError - Optional error callback for platform-specific reporting
 * @returns The created round, or null if creation failed
 */
export async function createRoundForPlayer(
  game: Game,
  player: Player,
  onError?: OnError,
): Promise<Round | null> {
  if (!game.$isLoaded || !game.rounds?.$isLoaded || !game.players?.$isLoaded) {
    return null;
  }

  if (!player.$isLoaded) {
    return null;
  }

  try {
    const gameDate = game.start;
    const roundGroup = game.rounds.$jazz.owner as Group;

    const newRound = Round.create(
      {
        start: gameDate,
        playerId: player.$jazz.id,
        handicapIndex: player.handicap?.$isLoaded
          ? player.handicap.display || "0.0"
          : "0.0",
        scores: RoundScores.create({}, { owner: roundGroup }),
      },
      { owner: roundGroup },
    );

    // Link round to game via RoundToGame edge.
    // game.rounds is owned by the game's group (created by the current user),
    // so this push always succeeds.
    const roundToGame = RoundToGame.create(
      {
        round: newRound,
        handicapIndex: newRound.handicapIndex,
      },
      { owner: roundGroup },
    );

    game.rounds.$jazz.push(roundToGame);

    return newRound;
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)), {
      source: "createRoundForPlayer",
      context: {
        gameId: game.$jazz.id,
        playerId: player.$jazz.id,
      },
    });
    return null;
  }
}
