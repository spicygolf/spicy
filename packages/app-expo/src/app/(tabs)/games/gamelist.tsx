import { useAccount, useCoState } from "@/providers/jazz";
import GameList from "@/components/GameList";
import { Game, ListOfGames } from "@/schema/games";
import { Group } from "jazz-tools";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function GameListScreen() {
  const { me } = useAccount();
  const games = useCoState(ListOfGames, me.root?.games?.id, [{}]);

  const createGame = () => {
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const game = Game.create(
      { name: "My Game", start: new Date() },
      { owner: group }
    );
    games.push(game);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex m-3">
        <TouchableOpacity
          onPress={createGame}
          className="bg-blue-500 p-4 rounded-md my-4 flex-row items-center justify-center"
        >
          <Text className="text-white font-semibold text-center">New Game</Text>
        </TouchableOpacity>
        <GameList games={games} />
      </View>
    </SafeAreaView>
  );
}
