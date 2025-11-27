import { useCoState } from "jazz-tools/react-native";
import type { Player } from "spicylib/schema";
import { Player as PlayerSchema } from "spicylib/schema";

interface UsePlayerOptions {
  resolve?: Record<string, unknown>;
}

/**
 * Hook to load a Player with customizable resolve queries.
 *
 * @param playerId - Player ID to load
 * @param options - Configuration options
 * @param options.resolve - Custom Jazz resolve query (overrides default)
 *
 * @example
 * // Minimal load for player list
 * const player = usePlayer(id, {
 *   resolve: {
 *     name: true,
 *     handicap: true
 *   }
 * });
 *
 * @example
 * // Deep load for player profile
 * const player = usePlayer(id, {
 *   resolve: {
 *     name: true,
 *     email: true,
 *     handicap: true,
 *     clubs: { $each: true },
 *     envs: true,
 *     rounds: { $each: true }
 *   }
 * });
 */
export function usePlayer(
  playerId: string | undefined,
  options: UsePlayerOptions = {},
): Player | null {
  const resolveQuery = options.resolve || {
    name: true,
    email: true,
    short: true,
    gender: true,
    ghinId: true,
    handicap: true,
    envs: true,
  };

  const player = useCoState(
    PlayerSchema,
    playerId || "",
    playerId
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
  ) as Player | null;

  return player;
}
