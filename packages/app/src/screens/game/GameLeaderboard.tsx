import { useGame } from "@/hooks";
import { Screen, Text } from "@/ui";

export function GameLeaderboard() {
  // Get the current game from context with minimal resolve for leaderboard
  const { game } = useGame(undefined, {
    resolve: {
      name: true,
      players: { $each: { name: true, handicap: true } },
      rounds: {
        $each: {
          round: { playerId: true, scores: true },
        },
      },
    },
  });

  if (!game) {
    // This should not happen because we set requireGame: true
    return null;
  }

  return (
    <Screen>
      <Text>leaderboard</Text>
    </Screen>
  );
}
