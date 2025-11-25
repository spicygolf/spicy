import { useCoState } from "jazz-tools/react-native";
import { Game } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

type UseGameOptions = {
  requireGame?: boolean;
  loadHoles?: boolean;
};

type GameWithRelations = Awaited<ReturnType<typeof Game.load>> | null;

export function useGame(gameId?: string, options: UseGameOptions = {}) {
  const { game: ctxGame } = useGameContext();
  const effectiveGameId = gameId || ctxGame?.$jazz.id;

  const resolve = effectiveGameId
    ? {
        resolve: {
          specs: { $each: true },
          scope: {
            teamsConfig: true,
          },
          // PERFORMANCE: Only load holes if requested via loadHoles option
          ...(options.loadHoles && {
            holes: {
              $each: {
                teams: {
                  $each: {
                    rounds: {
                      $each: {
                        roundToGame: {
                          round: {
                            scores: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
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
                tee: {
                  ratings: {
                    total: true,
                    front: true,
                    back: true,
                  },
                },
                course: true,
              },
            },
          },
        },
      }
    : undefined;

  // Use the hook with proper typing
  const game = useCoState(Game, effectiveGameId || "", {
    ...resolve,
    select: (value) =>
      value.$isLoaded
        ? value
        : value.$jazz.loadingState === "loading"
          ? undefined
          : null,
  }) as unknown as GameWithRelations;

  if (!effectiveGameId) {
    if (options.requireGame) {
      throw new Error("No game ID provided and no current game in context");
    }
    return { game: null };
  }

  return { game };
}
