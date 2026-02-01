import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChangeTeamsModal } from "@/components/game/scoring";
import { useGameContext } from "@/contexts/GameContext";
import {
  useCurrentHole,
  useGameInitialization,
  useHoleInitialization,
  useHoleNavigation,
  useScoreManagement,
} from "@/hooks";
import { Button, Screen, Text } from "@/ui";
import { ScoringView } from "./ScoringView";
import { SummaryView } from "./SummaryView";
import { TeamChooserView } from "./TeamChooserView";
import { useTeamManagement } from "./useTeamManagement";

interface GameScoringProps {
  onNavigateToSettings?: () => void;
}

export function GameScoring({ onNavigateToSettings }: GameScoringProps) {
  // Use shared game and scoreboard from context
  const { scoringGame: game, scoreboard, scoringContext } = useGameContext();

  // One-time game initialization (creates holes if needed)
  useGameInitialization(game);

  // Hook 1: Hole navigation (current hole, prev/next)
  const {
    currentHoleIndex,
    currentHoleId,
    currentHoleNumber,
    holeInfo,
    holesList,
    showSummary,
    handlePrevHole,
    handleNextHole,
  } = useHoleNavigation(game);

  // Hook 1b: Load current hole's teams with selector to prevent re-renders
  const currentHole = useCurrentHole(currentHoleId, { currentHoleIndex });

  // Hook 2: Team management (chooser state, assignments, change teams)
  const {
    showChooser,
    showChangeTeamsModal,
    changeTeamsScope,
    teamCount,
    rotateEvery,
    setShowChangeTeamsModal,
    setChangeTeamsScope,
    handleChangeTeamsConfirm,
    handleTeamAssignmentsChange,
  } = useTeamManagement(game, currentHoleIndex, holesList);

  // Per-hole initialization (ensures teams exist for current hole)
  useHoleInitialization(game, currentHoleIndex, rotateEvery);

  // Hook 3: Score management (Jazz database updates)
  const { handleScoreChange, handleUnscore } = useScoreManagement(
    game,
    currentHoleIndex,
    holeInfo,
  );

  if (!game) {
    return null;
  }

  if (holesList.length === 0) {
    // Check if we're still loading game data
    const isLoading =
      !game.rounds?.$isLoaded ||
      (game.rounds.length > 0 && game.rounds.some((rtg) => !rtg?.$isLoaded));

    if (isLoading) {
      return (
        <Screen>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.message}>Loading game...</Text>
          </View>
        </Screen>
      );
    }

    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>No holes found for this game</Text>
        </View>
      </Screen>
    );
  }

  if (!holeInfo) {
    // Determine why we don't have hole info and show appropriate message
    const hasPlayers = game.players?.$isLoaded && game.players.length > 0;
    const hasRounds = game.rounds?.$isLoaded && game.rounds.length > 0;

    // Check if the issue is missing course/tee selections
    const hasMissingSelections =
      hasRounds &&
      game.rounds.some((rtg) => {
        if (!rtg?.$isLoaded) return false;
        const round = rtg.round;
        if (!round?.$isLoaded) return false;
        return !round.$jazz.has("course") || !round.$jazz.has("tee");
      });

    let message = "Loading hole information...";
    let showSettingsButton = false;

    if (!hasPlayers) {
      message = "Ready to tee off? Add players to get started! ⛳";
      showSettingsButton = true;
    } else if (hasMissingSelections) {
      message =
        "Course and tee selections are required for all players before scoring can begin.";
      showSettingsButton = true;
    }

    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>{message}</Text>
          {showSettingsButton && onNavigateToSettings && (
            <View style={styles.buttonContainer}>
              <Button
                label="Go to Game Settings"
                onPress={onNavigateToSettings}
              />
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screenNoPadding}>
      <View style={styles.container}>
        {/* Content: Summary, Team Chooser, or Scoring UI */}
        <ErrorBoundary>
          {showSummary ? (
            <SummaryView
              game={game}
              scoreboard={scoreboard}
              totalHoles={holesList.length}
              onPrevHole={handlePrevHole}
              onNextHole={handleNextHole}
            />
          ) : showChooser ? (
            <TeamChooserView
              game={game}
              holeInfo={holeInfo}
              teamCount={teamCount}
              currentHole={currentHole}
              onPrevHole={handlePrevHole}
              onNextHole={handleNextHole}
              onAssignmentsChange={handleTeamAssignmentsChange}
            />
          ) : (
            <ScoringView
              game={game}
              holeInfo={holeInfo}
              currentHole={currentHole}
              currentHoleIndex={currentHoleIndex}
              scoreboard={scoreboard}
              scoringContext={scoringContext}
              onPrevHole={handlePrevHole}
              onNextHole={handleNextHole}
              onScoreChange={handleScoreChange}
              onUnscore={handleUnscore}
              onChangeTeams={() => setShowChangeTeamsModal(true)}
            />
          )}
        </ErrorBoundary>

        {/* Change Teams Modal */}
        <ChangeTeamsModal
          visible={showChangeTeamsModal}
          scope={changeTeamsScope}
          currentHoleNumber={currentHoleNumber}
          rotateEvery={rotateEvery}
          currentHoleIndex={currentHoleIndex}
          holesListLength={holesList.length}
          onScopeChange={setChangeTeamsScope}
          onConfirm={handleChangeTeamsConfirm}
          onCancel={() => setShowChangeTeamsModal(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  screenNoPadding: {
    padding: 0,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  message: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: theme.gap(3),
  },
  buttonContainer: {
    marginTop: theme.gap(2),
    minWidth: 200,
  },
}));
