import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Golfer } from "@spicygolf/ghin";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { GameHeader } from "@/components/game/GameHeader";
import { StaleHandicapModal } from "@/components/game/StaleHandicapModal";
import { useGameContext } from "@/contexts/GameContext";
import { useGame, useStaleHandicapCheck } from "@/hooks";
import { apiPost } from "@/lib/api-client";
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

  // Extract gameId from route params
  const gameId = route.params.gameId;

  const { game } = useGame(gameId, {
    requireGame: true,
    resolve: {
      name: true,
      start: true,
      players: {
        $each: {
          handicap: true,
        },
      },
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Use game.$jazz.id to avoid re-runs on Jazz progressive loading
  useEffect(() => {
    if (!game?.$isLoaded) {
      setFacilityName(undefined);
      return;
    }

    getFacilityName(game).then(setFacilityName);
  }, [game?.$jazz.id]);

  // Update the current game ID in context - use gameId as stable dependency
  useEffect(() => {
    setGameId(gameId);
    return () => {
      setGameId(null);
    };
  }, [gameId, setGameId]);

  // Stale handicap check
  const { stalePlayers, dismissAll } = useStaleHandicapCheck(
    game?.$isLoaded ? game.players : undefined,
  );
  const [showStaleModal, setShowStaleModal] = useState(false);
  const [staleModalShown, setStaleModalShown] = useState(false);

  // Show the modal once when stale players are detected
  useEffect(() => {
    if (stalePlayers.length > 0 && !staleModalShown) {
      setShowStaleModal(true);
      setStaleModalShown(true);
    }
  }, [stalePlayers, staleModalShown]);

  const handleRefreshHandicaps = useCallback(
    async (ghinIds: string[]) => {
      setShowStaleModal(false);
      if (!game?.$isLoaded || !game.players?.$isLoaded) return;

      for (const ghinId of ghinIds) {
        try {
          const golfer = await apiPost<Golfer>("/ghin/players/get", {
            ghinNumber: Number(ghinId),
          });
          if (!golfer) continue;

          // Find the matching player and update their handicap
          for (const player of game.players) {
            if (!player?.$isLoaded || player.ghinId !== ghinId) continue;
            if (!player.handicap?.$isLoaded) continue;

            player.handicap.$jazz.set("display", golfer.hi_display);
            if (typeof golfer.hi_value === "number") {
              player.handicap.$jazz.set("value", golfer.hi_value);
            }
            if (golfer.rev_date instanceof Date) {
              player.handicap.$jazz.set("revDate", golfer.rev_date);
            } else if (golfer.rev_date) {
              player.handicap.$jazz.set("revDate", new Date(golfer.rev_date));
            }
            break;
          }
        } catch (error) {
          console.error(
            `Failed to refresh handicap for GHIN ${ghinId}:`,
            error,
          );
        }
      }
    },
    [game],
  );

  const handleDismissStale = useCallback(() => {
    setShowStaleModal(false);
    dismissAll();
  }, [dismissAll]);

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

      <StaleHandicapModal
        visible={showStaleModal}
        stalePlayers={stalePlayers}
        onRefresh={handleRefreshHandicaps}
        onDismiss={handleDismissStale}
      />
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
