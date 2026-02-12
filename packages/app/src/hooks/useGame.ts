// @ts-nocheck - Jazz type inference for custom selectors is too complex
import type { MaybeLoaded } from "jazz-tools";
import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import { Game } from "spicylib/schema";
import { useGameIdContext } from "@/contexts/GameContext";

interface UseGameOptions {
  requireGame?: boolean;
  resolve?: Record<string, unknown>;
  select?: (game: MaybeLoaded<Game>) => Game | null | undefined;
}

type GameWithRelations = Game | null;

/**
 * Default select function for useGame.
 * Defined at module scope so the reference is stable across renders.
 * This prevents useSyncExternalStoreWithSelector from re-evaluating
 * on every render, which with 10+ useGame consumers can cascade past
 * React 19's synchronous update depth limit.
 */
function defaultSelect(value: MaybeLoaded<Game>): Game | null | undefined {
  if (!value.$isLoaded) {
    return value.$jazz.loadingState === "loading" ? undefined : null;
  }
  return value;
}

/**
 * Hook to load a Game with customizable resolve queries.
 *
 * PERFORMANCE: Always specify minimal resolve queries for your use case.
 * Loading unnecessary data can multiply load times by 10x or more.
 *
 * @param gameId - Game ID to load (optional, falls back to context)
 * @param options - Configuration options
 * @param options.requireGame - Throw error if no game ID available
 * @param options.resolve - Custom Jazz resolve query (RECOMMENDED: always specify)
 */
export function useGame(
  gameId?: string,
  options: UseGameOptions = {},
): { game: GameWithRelations } {
  const { gameId: ctxGameId } = useGameIdContext();
  const effectiveGameId = gameId || ctxGameId || undefined;
  const startTime = useRef(Date.now());
  const loggedLoad = useRef(false);

  // Use custom resolve if provided, otherwise use default minimal resolve
  const resolveQuery = options.resolve || {
    name: true,
    start: true,
    scope: { teamsConfig: true },
    spec: { $each: { $each: true } },
    holes: true,
    players: { $each: { name: true, handicap: true, envs: true } },
    rounds: {
      $each: {
        handicapIndex: true,
        courseHandicap: true,
        gameHandicap: true,
        round: {
          playerId: true,
          handicapIndex: true,
          tee: {
            holes: { $each: true },
          },
          scores: true,
        },
      },
    },
  };

  const game = useCoState(
    Game,
    effectiveGameId,
    effectiveGameId
      ? ({
          resolve: resolveQuery,
          select: options.select || defaultSelect,
        } as {
          resolve: typeof resolveQuery;
          select: (value: MaybeLoaded<Game>) => Game | null | undefined;
        })
      : undefined,
  ) as unknown as GameWithRelations;

  // Performance tracking (dev only)
  useEffect(() => {
    if (__DEV__ && game?.$isLoaded && !loggedLoad.current) {
      loggedLoad.current = true;
      const elapsed = Date.now() - startTime.current;
      console.log("[PERF] useGame LOADED", {
        elapsed,
        gameId: game.$jazz.id,
      });
    }
  }, [game]);

  if (!effectiveGameId) {
    if (options.requireGame) {
      throw new Error("No game ID provided and no current game in context");
    }
    return { game: null };
  }

  return { game };
}
