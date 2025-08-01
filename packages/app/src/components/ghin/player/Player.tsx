import type { SearchPlayerResponse } from "ghin";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GhinPlayerSearchState } from "@/contexts/GhinPlayerSearchContext";
import { Text } from "@/ui";

export function Player({
  item,
  state,
  setState,
}: {
  item: SearchPlayerResponse;
  state: GhinPlayerSearchState;
  setState: (state: GhinPlayerSearchState) => void;
}) {
  if (!item) {
    return null;
  }

  const keyExtractor = (g: SearchPlayerResponse) =>
    `${g?.ghin}-${g?.club_id}-${g?.player_name}`;

  //   const fn = item.first_name;
  //   const gn = item.ghin;
  const key = keyExtractor(item);
  const player_name = item.player_name;
  const player_club = item.club_id;
  const hdcp = item.handicap_index;

  return (
    <TouchableOpacity
      style={styles.container}
      key={key}
      onPress={() => {
        setState({
          country: state.country,
          state: state.state,
          first_name: state.first_name,
          last_name: state.last_name,
          status: state.status,
          //   handicap: {
          //     source: "ghin",
          //     id: gn,
          //     index: hdcp,
          //   },
          //   name: player_name,
          //   short: fn,
        });
      }}
    >
      <View style={styles.container}>
        <Text style={styles.player_name}>{player_name}</Text>
        <Text style={styles.player_club}>{player_club}</Text>
      </View>
      <View>
        <Text style={styles.handicap}>{hdcp}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  player_name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  player_club: {
    fontSize: 14,
  },
  handicap: {
    fontSize: 14,
  },
}));
