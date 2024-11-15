import { useContext } from "react";
import { Text, View } from "react-native";
import { GameContext } from "@/providers/game";
import GameSettingsPlayers from "@/components/GameSettingsPlayers";

function GameSettings() {
  const { game } = useContext(GameContext);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <Text className="text-black dark:text-white">
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <GameSettingsPlayers />
    </View>
  );
}

export default GameSettings;
