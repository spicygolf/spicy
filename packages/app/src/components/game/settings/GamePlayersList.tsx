import { FlatList } from "react-native";
import { useGameContext } from "@/contexts/GameContext";
import { Text } from "@/ui";

export function GamePlayersList() {
  const { game } = useGameContext();

  return (
    <FlatList
      data={game?.players}
      renderItem={({ item: player }) => <Text>{player?.name}</Text>}
      keyExtractor={(item) => item?.id || ""}
    />
  );
}
