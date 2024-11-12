import { FlatList, Text, View } from "react-native";
import GameListItem from "@/components/GameListItem";
import { ListOfGames } from "@/schema/games";

function GameList({ games }: { games: ListOfGames }) {
  const deleteGame = (id: string) => {
    const idx = games.findIndex((game) => game.id === id);
    games.splice(idx, 1);
  };

  return (
    <View className="flex">
      <FlatList
        data={games}
        renderItem={({ item }) => (
          <GameListItem game={item} deleteGame={deleteGame} />
        )}
        keyExtractor={(item) => item?.id}
      />
    </View>
  );
}

export default GameList;
