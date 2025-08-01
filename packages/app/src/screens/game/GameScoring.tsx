import { useGameContext } from "@/contexts/GameContext";
import { Screen, Text } from "@/ui";

export function GameScoring() {
  // Get the current game from context
  const { game } = useGameContext();

  if (!game) {
    // This should not happen because we set requireGame: true
    return null;
  }

  return (
    <Screen>
      <Text>scoring</Text>
    </Screen>
  );
}
