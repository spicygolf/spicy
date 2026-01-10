import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import Ionicons from "@react-native-vector-icons/ionicons";
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
            <Ionicons size={28} name="golf" color={color} />
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

const styles = StyleSheet.create((theme) => ({
  tabBarStyle: {
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
}));
