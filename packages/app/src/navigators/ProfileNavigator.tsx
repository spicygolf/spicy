import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUnistyles } from "react-native-unistyles";
import { AccountScreen } from "@/screens/profile/AccountScreen";
import { DeveloperToolsScreen } from "@/screens/profile/DeveloperToolsScreen";
import { GhinLinkScreen } from "@/screens/profile/GhinLinkScreen";
import { ProfileHome } from "@/screens/profile/ProfileHome";
import { ThemeScreen } from "@/screens/profile/ThemeScreen";

export type ProfileNavigatorParamList = {
  ProfileHome: undefined;
  ThemeScreen: undefined;
  GhinLinkScreen: undefined;
  AccountScreen: undefined;
  DeveloperToolsScreen: undefined;
};

export function ProfileNavigator() {
  const Stack = createNativeStackNavigator<ProfileNavigatorParamList>();
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHome}
        options={{
          title: "Profile",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ThemeScreen"
        component={ThemeScreen}
        options={{
          title: "Theme",
        }}
      />
      <Stack.Screen
        name="GhinLinkScreen"
        component={GhinLinkScreen}
        options={{
          title: "GHIN Link",
        }}
      />
      <Stack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          title: "Account",
        }}
      />
      <Stack.Screen
        name="DeveloperToolsScreen"
        component={DeveloperToolsScreen}
        options={{
          title: "Developer Tools",
        }}
      />
    </Stack.Navigator>
  );
}
