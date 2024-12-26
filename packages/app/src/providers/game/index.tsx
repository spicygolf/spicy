import { SafeAreaView, View } from 'react-native';
import { Game } from 'schema/games';
import Back from 'components/Back';
import { useCoState } from 'providers/jazz';
import { ID } from 'jazz-tools';
import React, { createContext } from 'react';

interface GameProviderProps {
  gameId: string | string[];
  children: React.ReactNode;
}

export const GameContext = createContext<{
  game?: Game;
}>({
  game: undefined,
});

// TODO: add more to the header than just the back button
// TODO: bro, get the header out of the provider?
function GameProvider({ gameId, children }: GameProviderProps) {
  const gameIdParsed = gameId.toString() as ID<Game>;
  const game = useCoState(Game, gameIdParsed);
  if (!game) {
    // don't return anything if game is being fetched
    return null;
  }

  return (
    <GameContext.Provider value={{ game }}>
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-1 m-3">
          <Back />
          {children}
        </View>
      </SafeAreaView>
    </GameContext.Provider>
  );
}

export default GameProvider;
