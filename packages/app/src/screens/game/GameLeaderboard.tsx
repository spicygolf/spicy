import { useGame } from "@/hooks";
import { Screen, Text } from "@/ui";

export function GameLeaderboard() {
  // Get the current game from context
  const { game } = useGame();

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
