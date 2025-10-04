import { GamePlayersList } from "@/components/game/settings/GamePlayersList";
import { Screen } from "@/ui";

export function GameSettings() {
  return (
    <Screen>
      <GamePlayersList />
      {/* <GameSettingsOptions /> */}
      {/* <GameSettingsAdmin /> */}
    </Screen>
  );
}
