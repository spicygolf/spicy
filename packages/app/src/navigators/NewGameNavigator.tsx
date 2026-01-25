import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Back } from "@/components/Back";
import { NewGameFavorites } from "@/screens/games/NewGameFavorites";
import { NewGameSearch } from "@/screens/games/NewGameSearch";
import { Screen, Text } from "@/ui";

export type NewGameTabParamList = {
  NewGameFavorites: undefined;
  NewGameSearch: undefined;
};

export function NewGameNavigator() {
  const { theme } = useUnistyles();
  const [viewMode, setViewMode] = useState<"list" | "description">("list");
  const Tabs = createMaterialTopTabNavigator<NewGameTabParamList>();

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
    swipeEnabled: false,
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "description" : "list"));
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Back home={{ name: "GamesList" }} />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>New Game</Text>
          </View>
          <TouchableOpacity
            onPress={toggleViewMode}
            style={styles.viewModeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesome6
              name={viewMode === "list" ? "layer-group" : "list"}
              iconStyle="solid"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Tabs.Navigator
          screenOptions={tabScreenOptions}
          initialRouteName="NewGameFavorites"
        >
          <Tabs.Screen
            name="NewGameFavorites"
            options={{
              title: "Favorites",
            }}
          >
            {() => <NewGameFavorites viewMode={viewMode} />}
          </Tabs.Screen>
          <Tabs.Screen
            name="NewGameSearch"
            options={{
              title: "Search",
            }}
          >
            {() => <NewGameSearch viewMode={viewMode} />}
          </Tabs.Screen>
        </Tabs.Navigator>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.5),
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  viewModeButton: {
    padding: theme.gap(1),
  },
  selectedTabLine: {
    backgroundColor: theme.colors.action,
    height: 4,
  },
}));
