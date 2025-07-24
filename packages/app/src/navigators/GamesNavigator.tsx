import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GameProvider } from "@/contexts/GameContext";
import { GameNavigator } from "@/navigators/GameNavigator";
import { GameListScreen } from "@/screens/games/GameList";
import { NewGame } from "@/screens/games/NewGame";

export type GamesNavigatorParamList = {
  GamesList: undefined;
  NewGame: undefined;
  Game: { gameId: string };
};

const Stack = createNativeStackNavigator<GamesNavigatorParamList>();

export function GamesNavigator() {
  return (
    <GameProvider>
      <Stack.Navigator initialRouteName="GamesList">
        <Stack.Screen
          name="GamesList"
          component={GameListScreen}
          options={{
            title: "Games",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="NewGame"
          component={NewGame}
          options={{
            title: "New Game",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Game"
          component={GameNavigator}
          options={{
            title: "Game",
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </GameProvider>
  );
}

// Export the type for use in other components
export type GamesScreenProps<T extends keyof GamesNavigatorParamList> = {
  navigation: NativeStackNavigationProp<GamesNavigatorParamList, T>;
  route: { params: GamesNavigatorParamList[T] };
};
