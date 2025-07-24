import { FlatList, View } from "react-native";
import { GameListItem } from "@/components/game/list/GameListItem";
import type { ListOfGames } from "@/schema/games";

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
