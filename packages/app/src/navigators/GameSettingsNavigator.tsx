import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AddPlayerNavigator } from "@/navigators/AddPlayerNavigator";
import { GameSettings } from "@/screens/game/settings/GameSettings";

export type GameSettingsStackParamList = {
  GameSettings: undefined;
  AddPlayerNavigator: undefined;
};

export function GameSettingsNavigator() {
  const Stack = createNativeStackNavigator<GameSettingsStackParamList>();

  return (
    <Stack.Navigator
      initialRouteName="GameSettings"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="GameSettings" component={GameSettings} />
      <Stack.Screen name="AddPlayerNavigator" component={AddPlayerNavigator} />
    </Stack.Navigator>
  );
}
