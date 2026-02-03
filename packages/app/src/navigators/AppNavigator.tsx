import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import Ionicons from "@react-native-vector-icons/ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAccount } from "jazz-tools/react-native";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { GamesNavigator } from "@/navigators/GamesNavigator";
import { ProfileNavigator } from "@/navigators/ProfileNavigator";

type AppNavigatorParamList = {
  Games: undefined;
  Profile: undefined;
};

export function AppNavigator() {
  const Tabs = createBottomTabNavigator<AppNavigatorParamList>();
  const { theme } = useUnistyles();
  const me = useAccount(PlayerAccount, {
    resolve: { root: { settings: true } },
  });

  // Show badge on Profile if recovery phrase hasn't been saved
  // Must check if data is loaded first, then check the actual value
  const isLoaded = me?.$isLoaded && me.root?.$isLoaded;
  const showRecoveryBadge =
    isLoaded &&
    (!me.root.$jazz.has("settings") ||
      !me.root.settings?.$isLoaded ||
      me.root.settings.recoveryPhraseSaved !== true);

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
          tabBarButtonTestID: "tab-games",
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
          tabBarButtonTestID: "tab-profile",
          tabBarIcon: ({ color }) => (
            <View>
              <FontAwesome6
                size={28}
                name="user"
                color={color}
                iconStyle="solid"
              />
              {showRecoveryBadge && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
              )}
            </View>
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
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
}));
