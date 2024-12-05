import { useAccount, useCoState } from "@/providers/jazz";
import GameList from "@/components/game/list/GameList";
import { ListOfGames } from "@/schema/games";
import { SafeAreaView, Text, View } from "react-native";
import { Link } from "expo-router";

export default function GameListScreen() {
  const { me } = useAccount();
  const games = useCoState(ListOfGames, me.root?.games?.id, [{}]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="flex m-3">
        <Link
          href={{
            pathname: "/games/new",
            params: {},
          }}
          className="bg-blue-500 p-4 rounded-md my-4 flex-row items-center justify-center"
        >
          <Text className="text-white font-semibold text-center">New Game</Text>
        </Link>
        <GameList games={games!} />
      </View>
    </SafeAreaView>
  );
}
