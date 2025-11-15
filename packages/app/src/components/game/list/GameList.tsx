import { FlatList, View } from "react-native";
import type { ListOfGames } from "spicylib/schema";
import { GameListItem } from "@/components/game/list/GameListItem";

export function GameList({ games }: { games: ListOfGames | undefined }) {
  if (!games?.$isLoaded) {
    return null;
  }

  const loadedGames = games.filter((g) => g?.$isLoaded);

  return (
    <View>
      <FlatList
        data={loadedGames}
        renderItem={({ item }) => <GameListItem game={item} />}
        keyExtractor={(item) => item.$jazz.id}
      />
    </View>
  );
}
