import type { Group } from "jazz-tools";
import {
  type Game,
  ListOfRounds,
  type Player,
  Round,
  RoundScores,
  RoundToGame,
} from "spicylib/schema";
import { isSameDay } from "spicylib/utils";
import { reportError } from "./reportError";

/**
 * Gets rounds for a player that were created on a specific date.
 * Uses timezone-aware date comparison.
 *
 * @param player - The player to check (must be loaded with rounds resolved)
 * @param date - The date to check for rounds
 * @returns Array of rounds created on that date, or empty array if none/not loaded
 */
export function getRoundsForDate(player: Player, date: Date): Round[] {
  if (!player.$isLoaded || !player.rounds?.$isLoaded) {
    return [];
  }

  return player.rounds.filter((round): round is Round => {
    if (!round?.$isLoaded) return false;
    return isSameDay(round.start, date);
  });
}

/**
 * Creates a new round for a player and adds it to a game.
 * This is the shared logic used by both "Create New Round" button and auto-round creation.
 *
 * @param game - The game to add the round to (must be loaded with rounds and players resolved)
 * @param player - The player to create the round for (must be in game.players)
 * @returns The created round, or null if creation failed
 */
export async function createRoundForPlayer(
  game: Game,
  player: Player,
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

    // Create the new round
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

    // Add round to player's rounds list
    const playerGroup = game.players.$jazz.owner as Group;
    if (!player.$jazz.has("rounds") || !player.rounds?.$isLoaded) {
      const roundsList = ListOfRounds.create([newRound], {
        owner: playerGroup,
      });
      player.$jazz.set("rounds", roundsList);
    } else {
      player.rounds.$jazz.push(newRound);
    }

    // Create the RoundToGame edge and add to game
    // Note: courseHandicap is not set here because the round doesn't have a tee yet.
    // It will be calculated when the user selects a course/tee.
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
    reportError(error as Error, {
      source: "createRoundForPlayer",
      context: {
        gameId: game.$jazz.id,
        playerId: player.$jazz.id,
      },
    });
    return null;
  }
}
