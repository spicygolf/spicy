import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { Text } from "@/ui";

type GameView = "leaderboard" | "scoring" | "settings";

interface GameHeaderProps {
  game: Game;
  currentView?: GameView;
  onViewChange?: (view: GameView) => void;
}

export function GameHeader({
  game,
  currentView = "scoring",
  onViewChange,
}: GameHeaderProps) {
  const { theme } = useUnistyles();

  if (!game.$isLoaded) {
    return null;
  }

  const iconSize = 24;
  const getIconColor = (view: GameView) =>
    currentView === view ? theme.colors.action : theme.colors.secondary;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Left Icon - Leaderboard */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onViewChange?.("leaderboard")}
        >
          <FontAwesome6
            name="trophy"
            iconStyle="solid"
            size={iconSize}
            color={getIconColor("leaderboard")}
          />
        </TouchableOpacity>

        {/* Center - Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.name}>{game.name}</Text>
          <Text style={styles.date}>
            {game.start.toDateString()} -{" "}
            {game.start.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>

        {/* Right Icons - Scoring & Settings */}
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onViewChange?.("scoring")}
          >
            <FontAwesome6
              name="golf-ball-tee"
              iconStyle="solid"
              size={iconSize}
              color={getIconColor("scoring")}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onViewChange?.("settings")}
          >
            <FontAwesome6
              name="gear"
              iconStyle="solid"
              size={iconSize}
              color={getIconColor("settings")}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.gap(1),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.gap(2),
  },
  iconButton: {
    padding: theme.gap(1),
    minWidth: 40,
    alignItems: "center",
  },
  gameInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.gap(2),
  },
  rightIcons: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
  },
}));
