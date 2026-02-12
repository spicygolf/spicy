import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { GamePlayersList } from "@/components/game/settings/GamePlayersList";
import { GameOptionsList } from "@/components/game/settings/options/GameOptionsList";
import { GameTeamsList } from "@/components/game/settings/teams";
import { type SettingsTab, useGameIdContext } from "@/contexts/GameContext";
import { GhinCourseSearchProvider } from "@/contexts/GhinCourseSearchContext";
import { AddPlayerNavigator } from "@/navigators/AddPlayerNavigator";
import { SelectCourseNavigator } from "@/navigators/SelectCourseNavigator";
import { AddRoundToGame } from "@/screens/game/settings/AddRoundToGame";
import { HandicapAdjustment } from "@/screens/game/settings/HandicapAdjustment";
import { ManualCourseHoles } from "@/screens/game/settings/ManualCourseHoles";
import { Screen } from "@/ui";

// Stack navigation for the settings flows (add player, select course, etc.)
export type GameSettingsStackParamList = {
  GameSettingsTabs: undefined;
  AddPlayerNavigator: undefined;
  AddRoundToGame: { playerId: string };
  SelectCourseNavigator: { playerId: string; roundId?: string };
  HandicapAdjustment: { playerId: string; roundToGameId?: string };
  ManualCourseHoles: {
    playerId: string;
    roundId: string;
    courseName: string;
    teeName: string;
    teeGender: "M" | "F" | "Mixed";
    holesCount: number;
    totalYardage: number;
    courseRating: number;
    slopeRating: number;
    isEditMode?: boolean;
  };
};

// Tab navigation for the main settings views
type GameSettingsTabParamList = {
  PlayersTab: undefined;
  TeamsTab: undefined;
  OptionsTab: undefined;
};

function PlayersTab() {
  return (
    <Screen>
      <GamePlayersList />
    </Screen>
  );
}

function TeamsTab() {
  return (
    <Screen>
      <GameTeamsList />
    </Screen>
  );
}

function OptionsTab() {
  return (
    <Screen>
      <GameOptionsList />
    </Screen>
  );
}

const Tabs = createMaterialTopTabNavigator<GameSettingsTabParamList>();

function GameSettingsTabs() {
  const { theme } = useUnistyles();
  const { settingsTab, setSettingsTab } = useGameIdContext();

  const tabScreenOptions: MaterialTopTabNavigationOptions = {
    tabBarIndicatorStyle: styles.selectedTabLine,
    swipeEnabled: true,
    tabBarStyle: {
      height: 35,
    },
    tabBarLabelStyle: {
      padding: 0,
      marginTop: 0,
      marginBottom: 20,
      color: theme.colors.primary,
    },
  };

  return (
    <Tabs.Navigator
      initialRouteName={settingsTab}
      screenOptions={{ ...tabScreenOptions, lazy: true }}
      screenListeners={{
        state: (e) => {
          const route = e.data.state?.routes[e.data.state.index];
          if (route?.name) {
            setSettingsTab(route.name as SettingsTab);
          }
        },
      }}
    >
      <Tabs.Screen
        name="PlayersTab"
        component={PlayersTab}
        options={{ title: "Players" }}
      />
      <Tabs.Screen
        name="TeamsTab"
        component={TeamsTab}
        options={{ title: "Teams" }}
      />
      <Tabs.Screen
        name="OptionsTab"
        component={OptionsTab}
        options={{ title: "Options" }}
      />
    </Tabs.Navigator>
  );
}

const Stack = createNativeStackNavigator<GameSettingsStackParamList>();

export function GameSettings() {
  return (
    <Stack.Navigator
      initialRouteName="GameSettingsTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GameSettingsTabs" component={GameSettingsTabs} />
      <Stack.Screen name="AddPlayerNavigator" component={AddPlayerNavigator} />
      <Stack.Screen name="AddRoundToGame" component={AddRoundToGame} />
      <Stack.Screen name="SelectCourseNavigator">
        {(props) => (
          <GhinCourseSearchProvider>
            <SelectCourseNavigator {...props} />
          </GhinCourseSearchProvider>
        )}
      </Stack.Screen>
      <Stack.Screen name="HandicapAdjustment" component={HandicapAdjustment} />
      <Stack.Screen name="ManualCourseHoles" component={ManualCourseHoles} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create((theme) => ({
  selectedTabLine: {
    backgroundColor: theme.colors.action,
    height: 4,
  },
}));
