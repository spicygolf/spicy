import { Stack } from "expo-router/stack";

export default function GamesLayout() {
  return (
    <Stack initialRouteName="gamelist">
      <Stack.Screen
        name="gamelist"
        options={{
          title: "Games",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[gameId]"
        options={{
          title: "Game",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
