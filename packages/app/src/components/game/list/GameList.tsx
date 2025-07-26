import { FlatList, View } from "react-native";
import type { ListOfGames } from "spicylib/schema";
import { GameListItem } from "@/components/game/list/GameListItem";

export function GameList({ games }: { games: ListOfGames | undefined }) {
  return (
    <View>
      <FlatList
        data={games}
        renderItem={({ item }) => <GameListItem game={item} />}
        keyExtractor={(item, index) => item?.id ?? index.toString()}
      />
    </View>
  );
}
