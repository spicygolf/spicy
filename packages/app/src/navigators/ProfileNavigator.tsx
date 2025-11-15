import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useUnistyles } from "react-native-unistyles";
import { ProfileHome } from "@/screens/profile/ProfileHome";

export function ProfileNavigator() {
  const Stack = createNativeStackNavigator();
  const { theme } = useUnistyles();

  return (
    <Stack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
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
    </Stack.Navigator>
  );
}
