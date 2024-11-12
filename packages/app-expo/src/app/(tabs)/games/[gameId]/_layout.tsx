import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import GameProvider from "@/providers/game";

export default function GameLayout() {
  const { gameId } = useLocalSearchParams();

  return (
    <GameProvider gameId={gameId}>
      <Stack initialRouteName="settings">
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="scoring"
          options={{
            title: "Scoring",
            headerShown: false,
          }}
        />
      </Stack>
    </GameProvider>
  );
}
