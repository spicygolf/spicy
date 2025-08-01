import { useCoState } from "jazz-tools/react";
import { Game } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

type UseGameOptions = {
  requireGame?: boolean;
};

type GameWithRelations = Awaited<ReturnType<typeof Game.load>> | null;

// Define the resolve type specifically for Game
type GameResolve = {
  resolve: {
    start: true;
    name: true;
    specs: { $each: true };
    holes: { $each: true };
    players: { $each: true };
    rounds: { $each: true };
  };
};

export function useGame(gameId?: string, options: UseGameOptions = {}) {
  const { game: ctxGame } = useGameContext();
  const effectiveGameId = gameId || ctxGame?.id;

  // Create the resolve object with proper typing
  const resolve: GameResolve | undefined = effectiveGameId
    ? {
        resolve: {
          start: true,
          name: true,
          specs: { $each: true },
          holes: { $each: true },
          players: { $each: true },
          rounds: { $each: true },
        },
      }
    : undefined;

  // Use the hook with proper typing
  const game = useCoState(
    Game,
    effectiveGameId || "",
    resolve,
  ) as unknown as GameWithRelations;

  if (!effectiveGameId) {
    if (options.requireGame) {
      throw new Error("No game ID provided and no current game in context");
    }
    return { game: null };
  }

  return { game };
}
