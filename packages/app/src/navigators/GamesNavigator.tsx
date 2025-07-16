import type { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { GameNavigatorParamList } from "@/navigators/GameNavigator";
import { GameNavigator } from "@/navigators/GameNavigator";
import { GameListScreen } from "@/screens/games/GameList";
import { NewGame } from "@/screens/games/NewGame";

export type GamesNavigatorParamList = {
  GamesList: undefined;
  NewGame: undefined;
  Game: NavigatorScreenParams<GameNavigatorParamList>;
};

export function GamesNavigator() {
  const Stack = createNativeStackNavigator<GamesNavigatorParamList>();

  return (
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
  );
}
