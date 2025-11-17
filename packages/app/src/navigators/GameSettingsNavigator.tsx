import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUnistyles } from "react-native-unistyles";
import { GhinCourseSearchProvider } from "@/contexts/GhinCourseSearchContext";
import { AddPlayerNavigator } from "@/navigators/AddPlayerNavigator";
import { SelectCourseNavigator } from "@/navigators/SelectCourseNavigator";
import { AddRoundToGame } from "@/screens/game/settings/AddRoundToGame";
import { GameSettings } from "@/screens/game/settings/GameSettings";
import { HandicapAdjustment } from "@/screens/game/settings/HandicapAdjustment";

export type GameSettingsStackParamList = {
  GameSettings: undefined;
  AddPlayerNavigator: undefined;
  AddRoundToGame: { playerId: string };
  SelectCourseNavigator: { playerId: string; roundId?: string };
  HandicapAdjustment: { playerId: string; roundToGameId?: string };
};

function SelectCourseNavigatorWithProvider(
  props: NativeStackScreenProps<
    GameSettingsStackParamList,
    "SelectCourseNavigator"
  >,
) {
  return (
    <GhinCourseSearchProvider>
      <SelectCourseNavigator {...props} />
    </GhinCourseSearchProvider>
  );
}

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
      <Stack.Screen
        name="SelectCourseNavigator"
        component={SelectCourseNavigatorWithProvider}
      />
      <Stack.Screen name="HandicapAdjustment" component={HandicapAdjustment} />
    </Stack.Navigator>
  );
}
