// @ts-nocheck - Jazz type inference for custom selectors is too complex
import type { MaybeLoaded } from "jazz-tools";
import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import { Game } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

interface UseGameOptions {
  requireGame?: boolean;
  resolve?: Record<string, unknown>;
  select?: (game: MaybeLoaded<Game>) => Game | null | undefined;
}

type GameWithRelations = Game | null;

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
 *
 * @example
 * // Game List - minimal data (~10 objects, fast)
 * const { game } = useGame(id, {
 *   resolve: {
 *     name: true,
 *     start: true,
 *     players: { $each: { name: true } },
 *     rounds: { $each: { round: { course: { name: true } } } }
 *   }
 * });
 *
 * @example
 * // Game Header - just name and course info
 * const { game } = useGame(id, {
 *   resolve: {
 *     name: true,
 *     start: true,
 *     rounds: { $each: { round: { course: { name: true } } } }
 *   }
 * });
 *
 * @example
 * // Game Scoring - load holes shallowly, current hole loaded separately
 * const { game } = useGame(id, {
 *   resolve: {
 *     scope: { teamsConfig: true },
 *     holes: true, // Just IDs - useCurrentHole loads the active one
 *     players: { $each: { name: true, handicap: true, envs: true } },
 *     rounds: { $each: {
 *       handicapIndex: true,
 *       courseHandicap: true,
 *       round: { playerId: true, tee: { holes: { $each: true } }, scores: true }
 *     } }
 *   }
 * });
 *
 * @example
 * // Settings - player management
 * const { game } = useGame(id, {
 *   resolve: {
 *     players: { $each: { name: true, ghinId: true } },
 *     rounds: { $each: { round: true } }
 *   }
 * });
 *
 * ANTI-PATTERN: Don't load all 18 holes with full data
 * // BAD: Loads 100+ objects, very slow
 * holes: { $each: { teams: { $each: { rounds: { $each: true } } } } }
 *
 * // GOOD: Load holes shallowly, load current hole separately with useCurrentHole
 * holes: true
 */
export function useGame(
  gameId?: string,
  options: UseGameOptions = {},
): { game: GameWithRelations } {
  const { gameId: ctxGameId } = useGameContext();
  const effectiveGameId = gameId || ctxGameId || undefined;
  const startTime = useRef(Date.now());
  const loggedLoad = useRef(false);

  // Use custom resolve if provided, otherwise use default minimal resolve
  const resolveQuery = options.resolve || {
    name: true,
    start: true,
    scope: { teamsConfig: true },
    spec: { $each: true }, // Working copy of options (primary for scoring/display)
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
          // NOTE: course is NOT resolved here to avoid "value is unavailable" errors
          // during progressive loading when rounds are added. Components that need
          // course data should load it themselves asynchronously.
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
          select:
            options.select ||
            ((value) => {
              if (!value.$isLoaded) {
                return value.$jazz.loadingState === "loading"
                  ? undefined
                  : null;
              }
              return value;
            }),
        } as {
          resolve: typeof resolveQuery;
          select?: (value: MaybeLoaded<Game>) => Game | null | undefined;
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
