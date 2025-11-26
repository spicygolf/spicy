import { useCoState } from "jazz-tools/react-native";
import { GameHole } from "spicylib/schema";

interface UseCurrentHoleOptions {
  currentHoleIndex: number;
}

/**
 * Optimized hook to load ONLY the current hole's data
 * Following Jazz best practices: load what you need, when you need it
 * Uses selector to prevent re-renders during progressive data loading
 */
export function useCurrentHole(
  holeId: string | undefined,
  _options: UseCurrentHoleOptions,
) {
  // OPTIMIZATION: Use resolve query + selector to load only what's needed
  // The selector prevents re-renders as nested data loads progressively
  const currentHole = useCoState(
    GameHole,
    holeId || "",
    holeId
      ? {
          resolve: {
            teams: {
              $each: {
                rounds: {
                  $each: {
                    roundToGame: true, // Just load the reference, don't go deeper
                    $onError: "catch",
                  },
                },
              },
              $onError: "catch",
            },
          },
          // CRITICAL: Use selector to only return when fully loaded
          // This prevents 40+ re-renders as teams/rounds load progressively
          select: (hole) => {
            if (!hole.$isLoaded) return null;
            if (!hole.teams?.$isLoaded) return null;

            // Check if all teams are loaded
            for (const team of hole.teams as Iterable<
              (typeof hole.teams)[number]
            >) {
              if (!team?.$isLoaded) return null;
              if (!team.rounds?.$isLoaded) return null;
            }

            // All data is loaded, return the hole
            return hole;
          },
        }
      : undefined,
  );

  // Return loaded hole or null
  return currentHole;
}
