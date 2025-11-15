import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import GameNav from "@/components/game/GameNav";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { SelectCourseFavorites } from "@/screens/game/settings/SelectCourseFavorites";
import { SelectCourseManual } from "@/screens/game/settings/SelectCourseManual";
import { SelectCourseSearch } from "@/screens/game/settings/SelectCourseSearch";

export type SelectCourseTabParamList = {
  SelectCourseFavorites: { playerId: string; roundId?: string };
  SelectCourseSearch: { playerId: string; roundId?: string };
  SelectCourseManual: { playerId: string; roundId?: string };
};

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "SelectCourseNavigator"
>;

export function SelectCourseNavigator({ route }: Props) {
  const { playerId, roundId } = route.params;
  const { theme } = useUnistyles();
  const Tabs = createMaterialTopTabNavigator<SelectCourseTabParamList>();

  const tabScreenOptions: MaterialTopTabNavigationOptions = {
    tabBarIndicatorStyle: styles.selectedTabLine,
    tabBarStyle: {
      height: 35,
      backgroundColor: theme.colors.background,
    },
    tabBarLabelStyle: {
      padding: 0,
      marginTop: 0,
      marginBottom: 20,
      color: theme.colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      <GameNav title="Select Course & Tees" showBack={true} />
      <Tabs.Navigator
        screenOptions={tabScreenOptions}
        initialRouteName="SelectCourseFavorites"
      >
        <Tabs.Screen
          name="SelectCourseFavorites"
          component={SelectCourseFavorites}
          options={{
            title: "Favorites",
          }}
          initialParams={{ playerId, roundId }}
        />
        <Tabs.Screen
          name="SelectCourseSearch"
          component={SelectCourseSearch}
          options={{
            title: "Search",
          }}
          initialParams={{ playerId, roundId }}
        />
        <Tabs.Screen
          name="SelectCourseManual"
          component={SelectCourseManual}
          options={{
            title: "Manual",
          }}
          initialParams={{ playerId, roundId }}
        />
      </Tabs.Navigator>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  selectedTabLine: {
    backgroundColor: theme.colors.action,
    height: 4,
  },
}));
