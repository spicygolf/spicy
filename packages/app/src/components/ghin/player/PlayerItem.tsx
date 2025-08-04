import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { SearchPlayerResponse } from "ghin";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { useAddPlayerToGame } from "@/hooks";
import { Text } from "@/ui";

export function PlayerItem({ item }: { item: SearchPlayerResponse }) {
  const addPlayerToGame = useAddPlayerToGame();

  if (!item || !item.player_name) {
    return null;
  }

  const keyExtractor = (g: SearchPlayerResponse) =>
    `${g?.ghin}-${g?.club_id}-${g?.player_name}`;

  const key = keyExtractor(item);
  const player_name = item.player_name;
  const player_club = item.club_name;
  const hdcp = item.handicap_index;

  const makePlayer = (): Player => {
    return {
      name: player_name || "",
      email: "",
      short: item.first_name || "",
      handicap: item.ghin
        ? {
            source: "ghin" as const,
            identifier: item.ghin,
          }
        : undefined,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.fave_container}>
        <FontAwesome6 name="star" color="#666" size={24} />
      </View>
      <TouchableOpacity
        style={styles.player_container}
        key={key}
        onPress={() => {
          addPlayerToGame(makePlayer());
        }}
      >
        <View style={styles.player_name_container}>
          <Text style={styles.player_name}>{player_name}</Text>
          <Text style={styles.player_club}>{player_club}</Text>
        </View>
        <View style={styles.handicap_container}>
          <Text style={styles.handicap}>{hdcp}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.gap(0.25),
  },
  fave_container: {
    width: "10%",
    justifyContent: "center",
  },
  player_container: {
    width: "90%",
    flexDirection: "row",
  },
  player_name_container: {
    width: "80%",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  player_name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  player_club: {
    fontSize: 12,
  },
  handicap_container: {
    width: "20%",
    justifyContent: "center",
  },
  handicap: {
    fontSize: 18,
    textAlign: "right",
  },
}));
