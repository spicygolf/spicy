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
 * Returns null for both loading and not-found states — consumers use
 * game?.$isLoaded to distinguish "ready" from "not ready".
 */
function defaultSelect(value: MaybeLoaded<Game>): Game | null {
  if (!value.$isLoaded) return null;
  return value;
}

/**
 * Default resolve query for useGame. Hoisted to module scope so the reference
 * is stable across renders, preventing unnecessary Jazz re-subscriptions.
 */
const DEFAULT_RESOLVE_QUERY = {
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
} as const;

/**
 * Hook to load a Game with customizable resolve queries.
 *
 * Each consumer gets its own Jazz SubscriptionScope via useCoState, so
 * resolve depth only affects the calling component. Jazz 0.20.9 batches
 * initial child loading (silenceUpdates + pendingLoadedChildren), preventing
 * the render cascade that previously exceeded React 19's synchronous
 * update depth limit.
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

  const resolveQuery = options.resolve || DEFAULT_RESOLVE_QUERY;

  const game = useCoState(
    Game,
    effectiveGameId,
    // @ts-expect-error Jazz type inference for dynamic resolve + select is too complex
    effectiveGameId
      ? {
          resolve: resolveQuery,
          select: options.select || defaultSelect,
        }
      : undefined,
  ) as GameWithRelations;

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
