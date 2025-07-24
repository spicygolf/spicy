import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "@/schema/games";
import { Text } from "@/ui";

export function GameHeader({ game }: { game: Game }) {
  return (
    <View style={styles.container}>
      <View style={styles.gameInfo}>
        <Text style={styles.name}>{game.name}</Text>
        <Text style={styles.date}>
          {game.start.toDateString()} -{" "}
          {game.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>
      </View>
      <View style={styles.actions} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
  gameInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flex: 1,
    alignItems: "flex-end",
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
  },
}));
