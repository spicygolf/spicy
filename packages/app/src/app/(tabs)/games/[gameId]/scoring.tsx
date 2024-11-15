import { useContext } from "react";
import { Text, View } from "react-native";
import { GameContext } from "@/providers/game";

function GameScoring() {
  const { game } = useContext(GameContext);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <Text className="text-black dark:text-white">
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <Text className="text-black dark:text-white">
        scoring
      </Text>
    </View>
  );
}

export default GameScoring;
