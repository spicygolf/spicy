import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import { Game } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

type UseGameOptions = {
  requireGame?: boolean;
  loadHoles?: boolean;
};

type GameWithRelations = Game | null;

export function useGame(gameId?: string, options: UseGameOptions = {}) {
  const { gameId: ctxGameId } = useGameContext();
  const effectiveGameId = gameId || ctxGameId || undefined;
  const startTime = useRef(Date.now());
  const loggedRounds = useRef(false);
  const loggedHoles = useRef(false);

  const resolve = effectiveGameId
    ? {
        resolve: {
          specs: { $each: true },
          scope: {
            teamsConfig: true,
          },
          // OPTIMIZATION: Load holes with teams structure
          // Team rounds reference game.rounds (already loaded deeply above)
          // So this just loads the organizational structure, not the data itself
          holes: options.loadHoles
            ? {
                $each: {
                  teams: {
                    $each: {
                      rounds: {
                        $each: {
                          roundToGame: true, // Just the reference, not deeply loaded
                        },
                      },
                    },
                  },
                },
              }
            : true,
          players: {
            $each: {
              handicap: true,
              envs: true,
              rounds: { $each: true },
            },
          },
          rounds: {
            $each: {
              handicapIndex: true,
              courseHandicap: true,
              gameHandicap: true,
              round: {
                playerId: true,
                tee: {
                  holes: {
                    $each: true, // Load tee hole data for par/handicap
                  },
                  ratings: {
                    total: true,
                    front: true,
                    back: true,
                  },
                },
                course: true,
                scores: true, // Load scores map (Score objects will lazy-load on access)
              },
            },
          },
        },
      }
    : undefined;

  // Use the hook with proper typing
  // OPTIMIZATION: Use select to only re-render when fully loaded, not on every nested load
  const game = useCoState(Game, effectiveGameId || "", {
    ...resolve,
    select: (value) => {
      // Only return the game once it's fully loaded with the data we need
      // This prevents re-renders as nested data loads progressively
      if (!value.$isLoaded) {
        return value.$jazz.loadingState === "loading" ? undefined : null;
      }

      // Check if the critical data is loaded
      const roundsLoaded = options.loadHoles ? value.rounds?.$isLoaded : true;
      const holesLoaded = options.loadHoles ? value.holes?.$isLoaded : true;

      if (roundsLoaded && holesLoaded) {
        return value;
      }

      return undefined; // Still loading
    },
  }) as unknown as GameWithRelations;

  // Performance tracking
  useEffect(() => {
    if (game?.$isLoaded && game.rounds?.$isLoaded && !loggedRounds.current) {
      loggedRounds.current = true;
      const elapsed = Date.now() - startTime.current;
      console.log("[PERF] useGame rounds LOADED", {
        elapsed,
        roundsCount: game.rounds.length,
      });
    }
  }, [game, game?.$isLoaded]);

  useEffect(() => {
    if (game?.$isLoaded && game.holes?.$isLoaded && !loggedHoles.current) {
      loggedHoles.current = true;
      const elapsed = Date.now() - startTime.current;
      console.log("[PERF] useGame holes LOADED", {
        elapsed,
        holesCount: game.holes.length,
      });
    }
  }, [game, game?.$isLoaded]);

  if (!effectiveGameId) {
    if (options.requireGame) {
      throw new Error("No game ID provided and no current game in context");
    }
    return { game: null };
  }

  return { game };
}
