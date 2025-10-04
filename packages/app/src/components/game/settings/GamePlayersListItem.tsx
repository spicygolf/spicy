import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { Handicap } from "@/components/handicap/Handicap";
import { Text } from "@/ui";
import { PlayerDelete } from "./PlayerDelete";

export function GamePlayersListItem({ player }: { player: Player | null }) {
  if (!player) return null;
  const courseHandicap = undefined; // TODO: Implement course/game handicap calculation
  const gameHandicap = undefined; // TODO: Implement game handicap calculation (overrides course)

  const label = gameHandicap ? "game" : "course";
  const courseGameHandicap = gameHandicap ?? courseHandicap;

  return (
    <View style={styles.container}>
      <View style={styles.player}>
        <Text style={styles.player_name}>{player.name}</Text>
        <Text style={styles.player_tees}>Select Course/Tee</Text>
      </View>
      <View style={styles.handicaps}>
        <Handicap label="index" display={player?.handicap?.display} />
        <Handicap label={label} display={courseGameHandicap} />
      </View>
      <View style={styles.delete}>
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
  player: {
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
  handicaps: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  delete: {
    marginLeft: theme.gap(2),
  },
}));
