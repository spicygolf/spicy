import { useCoState } from "jazz-tools/react-native";
import type { GameHole } from "spicylib/schema";
import { GameHole as GameHoleSchema } from "spicylib/schema";

interface UseCurrentHoleOptions {
  currentHoleIndex: number;
  resolve?: Record<string, unknown>;
}

/**
 * Hook to load a GameHole with customizable resolve queries.
 * Uses selector to prevent re-renders during progressive data loading.
 *
 * @param holeId - GameHole ID to load
 * @param options - Configuration options
 * @param options.currentHoleIndex - Index of current hole (for reference)
 * @param options.resolve - Custom Jazz resolve query (overrides default)
 *
 * @example
 * // Load hole with teams for scoring
 * const hole = useCurrentHole(holeId, {
 *   currentHoleIndex: 0,
 *   resolve: {
 *     teams: {
 *       $each: {
 *         rounds: { $each: { roundToGame: true } }
 *       }
 *     }
 *   }
 * });
 */
export function useCurrentHole(
  holeId: string | undefined,
  options: UseCurrentHoleOptions,
): GameHole | null {
  const resolveQuery = options.resolve || {
    teams: {
      $each: {
        options: { $each: true }, // Load team options (junk, multipliers)
        rounds: {
          $each: {
            roundToGame: true,
            $onError: "catch",
          },
        },
      },
      $onError: "catch",
    },
  };

  const currentHole = useCoState(
    GameHoleSchema,
    holeId || "",
    holeId
      ? {
          resolve: resolveQuery,
          select: (hole) => {
            if (!hole.$isLoaded) return null;
            if (!hole.teams?.$isLoaded) return null;

            for (const team of hole.teams as Iterable<
              (typeof hole.teams)[number]
            >) {
              if (!team?.$isLoaded) return null;
              if (!team.rounds?.$isLoaded) return null;
              // Also wait for options to load (for junk/multipliers)
              if (team.$jazz.has("options") && !team.options?.$isLoaded) {
                return null;
              }
            }

            return hole;
          },
        }
      : undefined,
  );

  return currentHole as GameHole | null;
}
