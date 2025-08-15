import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { Golfer } from "ghin";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { type PlayerData, useAddPlayerToGame } from "@/hooks";
import { Text } from "@/ui";

export function PlayerItem({ item }: { item: Golfer }) {
  const addPlayerToGame = useAddPlayerToGame();

  const full_name = [item.first_name, item.middle_name, item.last_name].join(
    " ",
  );
  if (!item || !full_name) {
    return null;
  }

  const keyExtractor = (g: Golfer) => `${g?.ghin}-${g?.club_id}-${full_name}`;

  const key = keyExtractor(item);

  const makePlayer = (): PlayerData => {
    return {
      name: full_name || "",
      email: "",
      short: item.first_name || "",
      gender: item.gender,
      level: "",
      ghinId: item.ghin.toString(),
      handicap: item.ghin
        ? {
            source: "ghin" as const,
            display: item.hi_display,
            value:
              typeof item.hi_value === "number" ? item.hi_value : undefined,
            revDate: item.rev_date || undefined,
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
          <Text style={styles.player_name}>{full_name}</Text>
          <Text style={styles.player_club}>
            {item.club_name}
            {item.state ? `, ${item.state}` : ""}
          </Text>
        </View>
        <View style={styles.handicap_container}>
          <Text style={styles.handicap}>{item.hi_display}</Text>
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
    marginVertical: theme.gap(1),
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
    fontSize: 11,
    fontStyle: "italic",
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
