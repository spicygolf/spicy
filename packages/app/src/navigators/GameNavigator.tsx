import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { GameScoring } from "@/screens/game/GameScoring";
import { GameSettings } from "@/screens/game/GameSettings";

export type GameNavigatorParamList = {
  GameSettings: { gameId: string };
  GameScoring: { gameId: string };
};

export type GameSettingsProps = NativeStackScreenProps<
  GameNavigatorParamList,
  "GameSettings"
>;
export type GameScoringProps = NativeStackScreenProps<
  GameNavigatorParamList,
  "GameScoring"
>;

export function GameNavigator() {
  const Stack = createNativeStackNavigator<GameNavigatorParamList>();

  return (
    <Stack.Navigator initialRouteName="GameSettings">
      <Stack.Screen
        name="GameSettings"
        component={GameSettings}
        options={{
          title: "Settings",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GameScoring"
        component={GameScoring}
        options={{
          title: "Scoring",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
