import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCoState } from "jazz-tools/react-native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Game } from "spicylib/schema";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";
import { GameCourseTeeDisplay } from "./GameCourseTeeDisplay";

function formatPlayerName(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  const firstInitial = parts[0][0];
  const lastName = parts[parts.length - 1];
  return `${firstInitial}. ${lastName}`;
}

export function GameListItem({ game }: { game: Game | null | undefined }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  // Load game details on-demand with shallow subscription
  const loadedGame = useCoState(Game, game?.$jazz.id || "", {
    resolve: {
      players: {
        $each: true,
      },
      rounds: true,
    },
  });

  if (!game?.$isLoaded || !loadedGame?.$isLoaded) return null;

  // Generate player names directly from Jazz data - no useState/useEffect needed
  const playerNames = loadedGame.players?.$isLoaded
    ? loadedGame.players
        .filter((p) => p?.$isLoaded)
        .map((p) => formatPlayerName(p?.name))
        .join(" • ")
    : "";

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
        <Text style={styles.gameName}>{loadedGame.name}</Text>
        <Text style={styles.gameDateTime}>
          {loadedGame.start.toLocaleDateString()} -{" "}
          {loadedGame.start.toLocaleTimeString()}
        </Text>
        <GameCourseTeeDisplay rounds={loadedGame.rounds} />
        {playerNames && <Text style={styles.playerNames}>{playerNames}</Text>}
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
  playerNames: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
}));
