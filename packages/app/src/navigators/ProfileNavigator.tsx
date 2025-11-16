import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUnistyles } from "react-native-unistyles";
import { DeveloperToolsScreen } from "@/screens/profile/DeveloperToolsScreen";
import { ProfileHome } from "@/screens/profile/ProfileHome";

export type ProfileNavigatorParamList = {
  ProfileHome: undefined;
  DeveloperToolsScreen: undefined;
};

export function ProfileNavigator() {
  const Stack = createNativeStackNavigator<ProfileNavigatorParamList>();
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.primary,
        headerShadowVisible: false,
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
        name="DeveloperToolsScreen"
        component={DeveloperToolsScreen}
        options={{
          title: "Developer Tools",
        }}
      />
    </Stack.Navigator>
  );
}
