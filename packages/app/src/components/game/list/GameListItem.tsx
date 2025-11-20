import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";

export function GameListItem({ game }: { game: Game | null }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  if (!game?.$isLoaded) return null;

  const handleGamePress = () => {
    navigation.navigate("Game", { gameId: game.$jazz.id });
  };

  const handleSettingsPress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    navigation.navigate("Game", {
      gameId: game.$jazz.id,
      initialView: "settings",
    });
  };

  return (
    <TouchableOpacity onPress={handleGamePress} style={styles.container}>
      <View style={styles.game}>
        <Text style={styles.gameName}>{game.name}</Text>
        <Text style={styles.gameDateTime}>
          {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
        </Text>
      </View>
      <TouchableOpacity onPress={handleSettingsPress} style={styles.actions}>
        <FontAwesome6 name="gear" size={18} color="#666" iconStyle="solid" />
      </TouchableOpacity>
    </TouchableOpacity>
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
    padding: theme.gap(1),
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
