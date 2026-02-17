import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { GameHeader } from "@/components/game/GameHeader";
import { StaleHandicapChecker } from "@/components/game/StaleHandicapChecker";
import { useGameIdContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { GameLeaderboard } from "@/screens/game/GameLeaderboard";
import { GameScoring } from "@/screens/game/scoring";
import { GameSettings } from "@/screens/game/settings/GameSettings";

type GameNavigatorProps = NativeStackScreenProps<
  GamesNavigatorParamList,
  "Game"
>;

type GameView = "leaderboard" | "scoring" | "settings";

async function getFacilityName(game: Game): Promise<string | undefined> {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) {
    return undefined;
  }

  let firstFacilityName: string | undefined;

  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded) continue;

    const round = rtg.round;
    if (!round?.$isLoaded) continue;

    if (!round.$jazz.has("course")) continue;

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
        return undefined;
      }
    } catch {
      // Error loading course, skip this round
    }
  }

  return firstFacilityName;
}

export function GameNavigator({ route }: GameNavigatorProps) {
  const { setGameId } = useGameIdContext();
  const initialView = route.params.initialView || "scoring";
  const [currentView, setCurrentView] = useState<GameView>(initialView);

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

  const [facilityName, setFacilityName] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!game?.$isLoaded) {
      setFacilityName(undefined);
      return;
    }

    getFacilityName(game).then(setFacilityName);
  }, [game?.$jazz.id]);

  useEffect(() => {
    setGameId(gameId);
    return () => {
      setGameId(null);
    };
  }, [gameId, setGameId]);

  if (!game?.$isLoaded) {
    return null;
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

      <StaleHandicapChecker gameId={gameId} />
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
