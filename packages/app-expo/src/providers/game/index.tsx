import { SafeAreaView, View } from "react-native";
import { Game } from "@/schema/games";
import BackToGames from "@/components/BackToGames";
import { useCoState } from "@/providers/jazz";
import { ID } from "jazz-tools";
import { createContext } from "react";

interface GameProviderProps {
  gameId: string | string[];
  children: React.ReactNode;
}

export const GameContext = createContext<{
  game: Game;
}>({
  game: null,
});

// TODO: add more to the header than just the back button
// TODO: bro, get the header out of the provider?
function GameProvider({ gameId, children }: GameProviderProps) {
  const gameIdParsed = gameId.toString() as ID<Game>;
  const game = useCoState(Game, gameIdParsed);
  if (!game) return null; // don't return anything if game is being fetched

  return (
    <GameContext.Provider value={{ game }}>
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-1 m-3">
          <BackToGames />
          {children}
        </View>
      </SafeAreaView>
    </GameContext.Provider>
  );
}

export default GameProvider;
