import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Golfer } from "ghin";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useGameContext } from "@/contexts/GameContext";
import { type PlayerData, useAddPlayerToGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Text } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function PlayerItem({ item }: { item: Golfer }) {
  const { navigate } = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();
  const { game } = useGameContext();

  // Check if player is already in the game
  const isPlayerAlreadyAdded =
    game?.players?.some((player) => player?.ghinId === item.ghin.toString()) ||
    false;

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
        style={[
          styles.player_container,
          isPlayerAlreadyAdded && styles.player_container_disabled,
        ]}
        key={key}
        disabled={isPlayerAlreadyAdded}
        onPress={async () => {
          if (!isPlayerAlreadyAdded) {
            const result = await addPlayerToGame(makePlayer());
            if (result.isOk()) {
              const player = result.value;
              navigate("AddRoundToGame", { playerId: player.$jazz.id });
            } else {
              const error = result.error;
              // TODO error component
              console.error(error);
            }
          }
        }}
      >
        <View style={styles.player_name_container}>
          <Text
            style={[
              styles.player_name,
              isPlayerAlreadyAdded && styles.player_name_disabled,
            ]}
          >
            {full_name}
            {isPlayerAlreadyAdded && " ✓"}
          </Text>
          <Text
            style={[
              styles.player_club,
              isPlayerAlreadyAdded && styles.player_club_disabled,
            ]}
          >
            {item.club_name}
            {item.state ? `, ${item.state}` : ""}
          </Text>
        </View>
        <View style={styles.handicap_container}>
          <Text
            style={[
              styles.handicap,
              isPlayerAlreadyAdded && styles.handicap_disabled,
            ]}
          >
            {item.hi_display}
          </Text>
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
  player_container_disabled: {
    opacity: 0.6,
  },
  player_name_disabled: {
    color: "#666",
  },
  player_club_disabled: {
    color: "#999",
    fontStyle: "italic",
  },
  handicap_disabled: {
    color: "#666",
  },
}));
