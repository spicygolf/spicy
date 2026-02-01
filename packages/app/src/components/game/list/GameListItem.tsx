import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCoState } from "jazz-tools/react-native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Game } from "spicylib/schema";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Skeleton, SkeletonGroup, Text } from "@/ui";
import { GameCourseTeeDisplay } from "./GameCourseTeeDisplay";

function formatPlayerName(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  const firstInitial = parts[0][0];
  const lastName = parts[parts.length - 1];
  return `${firstInitial}. ${lastName}`;
}

/**
 * Skeleton placeholder for a game list item while loading.
 * Matches the layout: Game Name, Date/Time, Course•Tee, Players
 */
function GameListItemSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.game}>
        <SkeletonGroup>
          <Skeleton width={160} height={20} />
          <Skeleton width={180} height={14} />
          <Skeleton width={90} height={13} />
          <Skeleton width="70%" height={12} />
        </SkeletonGroup>
      </View>
      <View style={styles.actions}>
        <Skeleton width={18} height={18} borderRadius={4} />
      </View>
    </View>
  );
}

export function GameListItem({ game }: { game: Game | null | undefined }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  // Load game details with full resolve - includes course/tee for display
  const loadedGame = useCoState(Game, game?.$jazz.id, {
    resolve: {
      players: {
        $each: true,
      },
      rounds: {
        $each: {
          round: {
            course: {
              facility: true,
            },
            tee: true,
          },
        },
      },
    },
  });

  // Show skeleton while loading
  if (!game?.$isLoaded || !loadedGame?.$isLoaded) {
    return <GameListItemSkeleton />;
  }

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
      <TouchableOpacity
        onPress={handleSettingsPress}
        style={styles.actions}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
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
