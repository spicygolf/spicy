import { useCoState } from "jazz-tools/react-native";
import type { ListOfPlayers } from "spicylib/schema";
import { ListOfPlayers as ListOfPlayersSchema } from "spicylib/schema";

interface UsePlayersOptions {
  resolve?: Record<string, unknown>;
}

/**
 * Hook to load a ListOfPlayers with customizable resolve queries.
 *
 * PERFORMANCE: Use minimal resolve for list views.
 *
 * @param playersId - ListOfPlayers ID to load
 * @param options - Configuration options
 * @param options.resolve - Custom Jazz resolve query (overrides default)
 *
 * @example
 * // Minimal load for game list (just names)
 * const players = usePlayers(id, {
 *   resolve: {
 *     $each: { name: true }
 *   }
 * });
 *
 * @example
 * // Load with handicaps for scoring view
 * const players = usePlayers(id, {
 *   resolve: {
 *     $each: {
 *       name: true,
 *       handicap: true,
 *       envs: true
 *     }
 *   }
 * });
 */
export function usePlayers(
  playersId: string | undefined,
  options: UsePlayersOptions = {},
): ListOfPlayers | null {
  const resolveQuery = options.resolve || {
    $each: {
      name: true,
    },
  };

  const players = useCoState(
    ListOfPlayersSchema,
    playersId,
    playersId
      ? {
          resolve: resolveQuery,
          select: (value) => {
            if (!value.$isLoaded) {
              return value.$jazz.loadingState === "loading" ? undefined : null;
            }
            return value;
          },
        }
      : undefined,
  ) as ListOfPlayers | null;

  return players;
}
