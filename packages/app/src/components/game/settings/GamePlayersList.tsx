import { FlatList } from "react-native";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useGameContext } from "@/contexts/GameContext";
import { EmptyPlayersList } from "./EmptyPlayersList";

export function GamePlayersList() {
  const { game } = useGameContext();

  return (
    <FlatList
      data={game?.players}
      renderItem={({ item }) => <GamePlayersListItem player={item} />}
      keyExtractor={(item) => item?.id || ""}
      ListEmptyComponent={<EmptyPlayersList />}
    />
  );
}
