import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUnistyles } from "react-native-unistyles";
import { AddPlayerNavigator } from "@/navigators/AddPlayerNavigator";
import { AddRoundToGame } from "@/screens/game/settings/AddRoundToGame";
import { GameSettings } from "@/screens/game/settings/GameSettings";
import { SelectCourseTee } from "@/screens/game/settings/SelectCourseTee";

export type GameSettingsStackParamList = {
  GameSettings: undefined;
  AddPlayerNavigator: undefined;
  AddRoundToGame: { playerId: string };
  SelectCourseTee: { playerId: string; roundId?: string };
};

export function GameSettingsNavigator() {
  const Stack = createNativeStackNavigator<GameSettingsStackParamList>();
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      initialRouteName="GameSettings"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="GameSettings" component={GameSettings} />
      <Stack.Screen name="AddPlayerNavigator" component={AddPlayerNavigator} />
      <Stack.Screen name="AddRoundToGame" component={AddRoundToGame} />
      <Stack.Screen name="SelectCourseTee" component={SelectCourseTee} />
    </Stack.Navigator>
  );
}
