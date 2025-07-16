import { useGame } from "@/hooks";
import type { GameScoringProps } from "@/navigators/GameNavigator";
import { Screen, Text } from "@/ui";

export function GameScoring(props: GameScoringProps) {
  const { game } = useGame(props.route.params.gameId);
  if (!game) return null;

  return (
    <Screen>
      <Text>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <Text>scoring</Text>
    </Screen>
  );
}
