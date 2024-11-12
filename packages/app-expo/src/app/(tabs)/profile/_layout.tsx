import { Stack } from "expo-router/stack";

export default function ProfileLayout() {
  return (
    <Stack initialRouteName="profile">
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerShown: false
        }}
      />
    </Stack>
  );
}
