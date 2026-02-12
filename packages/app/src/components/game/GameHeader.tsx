import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { Text } from "@/ui";

type GameView = "leaderboard" | "scoring" | "settings";

interface GameHeaderProps {
  game: Game;
  currentView?: GameView;
  onViewChange?: (view: GameView) => void;
  facilityName?: string;
}

export function GameHeader({
  game,
  currentView = "scoring",
  onViewChange,
  facilityName,
}: GameHeaderProps) {
  const { theme } = useUnistyles();
  const [previousView, setPreviousView] = useState<"leaderboard" | "scoring">(
    "scoring",
  );

  // Track the previous view (leaderboard or scoring) when switching to settings
  // This hook must come before any early returns
  useEffect(() => {
    if (currentView === "leaderboard" || currentView === "scoring") {
      setPreviousView(currentView);
    }
  }, [currentView]);

  if (!game.$isLoaded) {
    return null;
  }

  const iconSize = 24;
  const getIconColor = (view: GameView) =>
    currentView === view ? theme.colors.action : theme.colors.secondary;

  // Toggle between leaderboard and scoring when the left button is clicked
  const handleToggle = () => {
    if (currentView === "settings") {
      // If on settings, go back to the previous view
      onViewChange?.(previousView);
    } else if (currentView === "leaderboard") {
      // If on leaderboard, go to scoring
      onViewChange?.("scoring");
    } else {
      // If on scoring, go to leaderboard
      onViewChange?.("leaderboard");
    }
  };

  // Determine which icon to show on the left toggle button
  const getToggleIcon = () => {
    if (currentView === "settings") {
      // When on settings, show the icon for the previous view
      return previousView === "leaderboard" ? "list-ul" : "pencil";
    } else if (currentView === "leaderboard") {
      return "pencil"; // Show pencil when on leaderboard (to switch to scoring)
    }
    return "list-ul"; // Show list when on scoring (to switch to leaderboard)
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Left Icon - Toggle between Leaderboard/Scoring */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleToggle}
          testID="game-header-toggle"
        >
          <FontAwesome6
            name={getToggleIcon()}
            iconStyle="solid"
            size={iconSize}
            color={
              currentView === "settings"
                ? theme.colors.secondary
                : theme.colors.action
            }
          />
        </TouchableOpacity>

        {/* Center - Game Info (tappable to navigate to settings) */}
        <TouchableOpacity
          style={styles.gameInfo}
          onPress={() => onViewChange?.("settings")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Game settings"
        >
          <Text style={styles.name}>{game.name}</Text>
          <Text style={styles.date}>
            {game.start.toDateString()} -{" "}
            {game.start.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
          <Text style={styles.facilityName}>{facilityName}</Text>
        </TouchableOpacity>

        {/* Right Icon - Settings */}
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
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingTop: theme.gap(1),
    paddingBottom: theme.gap(0.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  facilityName: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
}));
