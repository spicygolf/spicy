import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

export function GamePlayersListItem({ player }: { player: Player | null }) {
  if (!player) return null;
  return (
    <View style={styles.container}>
      <Text>{player.name}</Text>
      <PlayerDelete player={player} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.gap(0.5),
  },
}));
