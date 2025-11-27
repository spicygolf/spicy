import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { GameHeader } from "@/components/game/GameHeader";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { GameLeaderboard } from "@/screens/game/GameLeaderboard";
import { GameScoring } from "@/screens/game/scoring";
import { GameSettings } from "@/screens/game/settings/GameSettings";

// Props type for the GameNavigator screen
type GameNavigatorProps = NativeStackScreenProps<
  GamesNavigatorParamList,
  "Game"
>;

type GameView = "leaderboard" | "scoring" | "settings";

function getFacilityName(game: Game): string | undefined {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) {
    return undefined;
  }

  let firstFacilityName: string | undefined;

  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded) return undefined;

    const round = rtg.round;
    if (!round?.$isLoaded) return undefined;

    const course = round.course;
    if (!course?.$isLoaded) return undefined;

    const courseName = course.name;

    if (firstFacilityName === undefined) {
      firstFacilityName = courseName;
    } else if (firstFacilityName !== courseName) {
      // Mismatch - return undefined
      return undefined;
    }
  }

  return firstFacilityName;
}

export function GameNavigator({ route }: GameNavigatorProps) {
  const { setGameId } = useGameContext();
  const initialView = route.params.initialView || "scoring";
  const [currentView, setCurrentView] = useState<GameView>(initialView);

  // Extract gameId from route params
  const gameId = route.params.gameId;

  const { game } = useGame(gameId, {
    requireGame: true,
    resolve: {
      name: true,
      start: true,
      rounds: {
        $each: {
          round: {
            course: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Calculate facility name - show only if all players are on the same course
  // CRITICAL: Don't use useMemo with Jazz data - just calculate directly
  const facilityName = game?.$isLoaded ? getFacilityName(game) : undefined;

  // Update the current game ID in context - use gameId as stable dependency
  useEffect(() => {
    setGameId(gameId);
    return () => {
      setGameId(null);
    };
  }, [gameId, setGameId]);

  if (!game?.$isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <View style={styles.container}>
      <GameHeader
        game={game}
        currentView={currentView}
        onViewChange={setCurrentView}
        facilityName={facilityName}
      />
      <View style={styles.content}>
        {currentView === "leaderboard" && <GameLeaderboard />}
        {currentView === "scoring" && (
          <GameScoring
            onNavigateToSettings={() => setCurrentView("settings")}
          />
        )}
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
