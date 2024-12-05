import { Stack } from "expo-router/stack";

export default function GamesLayout() {
  return (
    <Stack initialRouteName="list">
      <Stack.Screen
        name="list"
        options={{
          title: "Games",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Game",
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
