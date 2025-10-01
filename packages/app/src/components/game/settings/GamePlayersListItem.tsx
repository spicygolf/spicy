import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

export function GamePlayersListItem({ player }: { player: Player | null }) {
  if (!player) return null;
  const courseHandicap = undefined; // TODO: Implement course/game handicap calculation

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.player_name}>{player.name}</Text>
        <Text style={styles.player_tees}>Select Course/Tee</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.handicap}>{player?.handicap?.display}</Text>
        <Text style={styles.handicap}>{courseHandicap || "-"}</Text>
        <PlayerDelete player={player} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1),
  },
  left: {
    flex: 5,
    flexDirection: "column",
  },
  player_name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  player_tees: {
    flex: 1,
    fontSize: 14,
  },
  right: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  handicap: {
    fontSize: 16,
    textAlign: "right",
    marginRight: theme.gap(2),
  },
}));
