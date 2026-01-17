import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { GameNav } from "@/components/game/GameNav";
import { AddPlayerFavorites } from "@/screens/game/settings/AddPlayerFavorites";
import { AddPlayerManual } from "@/screens/game/settings/AddPlayerManual";
import { AddPlayerSearch } from "@/screens/game/settings/AddPlayerSearch";

export type AddPlayerTabParamList = {
  AddPlayerFavorites: undefined;
  AddPlayerSearch: undefined;
  AddPlayerManual: undefined;
};

export function AddPlayerNavigator() {
  const { theme } = useUnistyles();
  const Tabs = createMaterialTopTabNavigator<AddPlayerTabParamList>();

  const tabScreenOptions: MaterialTopTabNavigationOptions = {
    tabBarIndicatorStyle: styles.selectedTabLine,
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
    <View style={styles.container}>
      <GameNav title="Add Player" showBack={true} />
      <Tabs.Navigator
        screenOptions={tabScreenOptions}
        initialRouteName="AddPlayerFavorites"
      >
        <Tabs.Screen
          name="AddPlayerFavorites"
          component={AddPlayerFavorites}
          options={{
            title: "Favorites",
          }}
        />
        <Tabs.Screen
          name="AddPlayerSearch"
          component={AddPlayerSearch}
          options={{
            title: "Search",
          }}
        />
        <Tabs.Screen
          name="AddPlayerManual"
          component={AddPlayerManual}
          options={{
            title: "Manual",
          }}
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
