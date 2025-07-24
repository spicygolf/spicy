import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native-unistyles";
import { GamesNavigator } from "@/navigators/GamesNavigator";
import { ProfileNavigator } from "@/navigators/ProfileNavigator";

type AppNavigatorParamList = {
  Games: undefined;
  Profile: undefined;
};

export function AppNavigator() {
  const Tabs = createBottomTabNavigator<AppNavigatorParamList>();

  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBarStyle,
      }}
      initialRouteName="Games"
    >
      <Tabs.Screen
        name="Games"
        component={GamesNavigator}
        options={{
          title: "Games",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome6
              size={28}
              name="pencil"
              color={color}
              iconStyle="solid"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome6
              size={28}
              name="user"
              color={color}
              iconStyle="solid"
            />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "transparent",
    borderTopWidth: 0.5,
  },
});
