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
type LeaderboardViewMode = "gross" | "net" | "points";

async function getFacilityName(game: Game): Promise<string | undefined> {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) {
    return undefined;
  }

  let firstFacilityName: string | undefined;

  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded) continue;

    const round = rtg.round;
    if (!round?.$isLoaded) continue;

    // Check if course field exists before accessing
    if (!round.$jazz.has("course")) continue;

    // Load course data asynchronously
    try {
      const loadedRound = await round.$jazz.ensureLoaded({
        resolve: {
          course: true,
        },
      });

      const course = loadedRound.course;
      if (!course?.$isLoaded || !course.name) continue;

      const courseName = course.name;

      if (firstFacilityName === undefined) {
        firstFacilityName = courseName;
      } else if (firstFacilityName !== courseName) {
        // Mismatch - return undefined
        return undefined;
      }
    } catch {
      // Error loading course, skip this round
    }
  }

  return firstFacilityName;
}

export function GameNavigator({ route }: GameNavigatorProps) {
  const { setGameId } = useGameContext();
  const initialView = route.params.initialView || "scoring";
  const [currentView, setCurrentView] = useState<GameView>(initialView);
  const [leaderboardViewMode, setLeaderboardViewMode] =
    useState<LeaderboardViewMode>("gross");

  // Extract gameId from route params
  const gameId = route.params.gameId;

  const { game } = useGame(gameId, {
    requireGame: true,
    resolve: {
      name: true,
      start: true,
      rounds: {
        $each: {
          round: true,
        },
      },
    },
  });

  // Calculate facility name - show only if all players are on the same course
  const [facilityName, setFacilityName] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!game?.$isLoaded) {
      setFacilityName(undefined);
      return;
    }

    getFacilityName(game).then(setFacilityName);
  }, [game]);

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
        {currentView === "leaderboard" && (
          <GameLeaderboard
            viewMode={leaderboardViewMode}
            onViewModeChange={setLeaderboardViewMode}
          />
        )}
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
