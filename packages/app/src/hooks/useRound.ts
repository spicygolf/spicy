import { useCoState } from "jazz-tools/react-native";
import type { Round } from "spicylib/schema";
import { Round as RoundSchema } from "spicylib/schema";

interface UseRoundOptions {
  resolve?: Record<string, unknown>;
}

/**
 * Hook to load a Round with customizable resolve queries.
 *
 * @param roundId - Round ID to load
 * @param options - Configuration options
 * @param options.resolve - Custom Jazz resolve query (overrides default)
 *
 * @example
 * // Minimal load for round list
 * const round = useRound(id, {
 *   resolve: {
 *     playerId: true,
 *     course: { name: true }
 *   }
 * });
 *
 * @example
 * // Deep load for scoring
 * const round = useRound(id, {
 *   resolve: {
 *     playerId: true,
 *     handicapIndex: true,
 *     course: true,
 *     tee: { holes: { $each: true } },
 *     scores: true
 *   }
 * });
 */
export function useRound(
  roundId: string | undefined,
  options: UseRoundOptions = {},
): Round | null {
  const resolveQuery = options.resolve || {
    playerId: true,
    handicapIndex: true,
    course: true,
    tee: true,
    scores: true,
  };

  const round = useCoState(
    RoundSchema,
    roundId,
    roundId
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
  ) as Round | null;

  return round;
}
