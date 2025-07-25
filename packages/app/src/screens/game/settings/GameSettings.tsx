import { GameSettingsPlayers } from "@/components/game/settings/GameSettingsPlayers";
import { Screen } from "@/ui";

export function GameSettings() {
  return (
    <Screen>
      <GameSettingsPlayers />
      {/* <GameSettingsOptions /> */}
      {/* <GameSettingsAdmin /> */}
    </Screen>
  );
}
