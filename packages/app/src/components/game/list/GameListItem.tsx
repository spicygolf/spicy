import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "@/schema/games";
import { Link, Text } from "@/ui";

export function GameListItem({ game }: { game: Game | null }) {
  if (!game) return null;
  return (
    <Link
      href={{
        path: `/games/${game.id}/scoring`,
      }}
      style={styles.container}
    >
      <View style={styles.game}>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDateTime}>
          {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
        </Text>
      </View>
      <Link
        href={{ path: `/games/${game.id}/settings` }}
        style={styles.actions}
      >
        <FontAwesome6 name="gear" size={18} color="#666" iconStyle="solid" />
      </Link>
    </Link>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1),
  },
  game: {
    flex: 1,
  },
  actions: {
    alignItems: "center",
    justifyContent: "center",
  },
  gameName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  gameDateTime: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
