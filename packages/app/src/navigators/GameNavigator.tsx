import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GameHeader } from "@/components/game/GameHeader";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { GameLeaderboard } from "@/screens/game/GameLeaderboard";
import { GameScoring } from "@/screens/game/GameScoring";
import { GameSettings } from "@/screens/game/settings/GameSettings";

// Props type for the GameNavigator screen
type GameNavigatorProps = NativeStackScreenProps<
  GamesNavigatorParamList,
  "Game"
>;

type GameView = "leaderboard" | "scoring" | "settings";

export function GameNavigator({ route }: GameNavigatorProps) {
  const { setGame } = useGameContext();
  const initialView = route.params.initialView || "scoring";
  const [currentView, setCurrentView] = useState<GameView>(initialView);

  // Extract gameId from route params
  const gameId = route.params.gameId;

  const { game } = useGame(gameId, { requireGame: true });

  // Update the current game in context when the route changes
  useEffect(() => {
    if (game?.$isLoaded) {
      setGame(game);
    }
    return () => {
      setGame(null);
    };
  }, [game, setGame]);

  if (!game?.$isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <View style={styles.container}>
      <GameHeader
        game={game}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <View style={styles.content}>
        {currentView === "leaderboard" && <GameLeaderboard />}
        {currentView === "scoring" && <GameScoring />}
        {currentView === "settings" && <GameSettings />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}));
