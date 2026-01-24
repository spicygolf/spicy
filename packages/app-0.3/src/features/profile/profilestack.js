import { createStackNavigator } from "@react-navigation/stack";
import { red } from "common/colors";
import LinkHandicap from "features/profile/linkHandicap";
import ProfileHome from "features/profile/profilehome";
import Account from "features/profile/settings/account.js";
import AccountChange from "features/profile/settings/accountChange.js";
import ClearCache from "features/profile/settings/clearCache.js";
import Impersonate from "features/profile/settings/impersonate.js";
import Logout from "features/profile/settings/logout.js";
import SettingsHome from "features/profile/settings/settings.js";
import { SafeAreaView, StyleSheet } from "react-native";

const ProfileStack = (_props) => {
  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName="ProfileHome"
        screenOptions={{
          title: "Profile",
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="ProfileHome"
          component={ProfileHome}
          screenOptions={{
            title: "Profile",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LinkHandicap"
          component={LinkHandicap}
          options={{
            title: "Link Handicap Service",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsHome}
          options={{
            title: "Settings",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="Account"
          component={Account}
          options={{
            title: "Account",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="AccountChange"
          component={AccountChange}
          options={{
            title: "Change",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="ClearCache"
          component={ClearCache}
          options={{
            title: "Clear Local Data",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="Logout"
          component={Logout}
          options={{
            title: "Logout",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="Impersonate"
          component={Impersonate}
          options={{
            title: "Impersonate",
            headerShown: true,
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default ProfileStack;

const styles = StyleSheet.create({
  container: {
    backgroundColor: red,
    flex: 1,
  },
});
