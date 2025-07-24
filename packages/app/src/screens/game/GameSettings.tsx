import { GameSettingsPlayers } from "@/components/game/settings/GameSettingsPlayers";
import { useGameContext } from "@/contexts/GameContext";
import { Screen } from "@/ui";

export function GameSettings() {
  // Get the current game from context
  const { game } = useGameContext();

  if (!game) {
    // This should not happen because we set requireGame: true
    return null;
  }

  return (
    <Screen>
      <GameSettingsPlayers game={game} />
    </Screen>
  );
}
