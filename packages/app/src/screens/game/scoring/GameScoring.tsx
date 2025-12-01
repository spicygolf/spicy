import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChangeTeamsModal } from "@/components/game/scoring";
import {
  useCurrentHole,
  useGame,
  useGameInitialization,
  useHoleInitialization,
  useHoleNavigation,
  useScoreManagement,
} from "@/hooks";
import { Button, Screen, Text } from "@/ui";
import { ScoringView } from "./ScoringView";
import { TeamChooserView } from "./TeamChooserView";
import { useTeamManagement } from "./useTeamManagement";

interface GameScoringProps {
  onNavigateToSettings?: () => void;
}

export function GameScoring({ onNavigateToSettings }: GameScoringProps) {
  const { game } = useGame(undefined, {
    resolve: {
      name: true,
      start: true,
      scope: { teamsConfig: true },
      specs: { $each: true },
      holes: true, // Load holes list shallowly - individual holes loaded by useCurrentHole
      players: {
        $each: {
          name: true,
          handicap: true,
          envs: true,
        },
      },
      rounds: {
        $each: {
          handicapIndex: true,
          courseHandicap: true,
          gameHandicap: true,
          round: {
            playerId: true,
            scores: true,
          },
        },
      },
    },
  });

  // One-time game initialization (creates holes if needed)
  useGameInitialization(game);

  // Hook 1: Hole navigation (current hole, prev/next)
  const {
    currentHoleIndex,
    currentHoleId,
    currentHoleNumber,
    holeInfo,
    holesList,
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
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>No holes found for this game</Text>
        </View>
      </Screen>
    );
  }

  if (!holeInfo) {
    // Check if the issue is missing course/tee selections
    const hasMissingSelections =
      game.rounds?.$isLoaded &&
      game.rounds.some((rtg) => {
        if (!rtg?.$isLoaded) return false;
        const round = rtg.round;
        if (!round?.$isLoaded) return false;
        return !round.$jazz.has("course") || !round.$jazz.has("tee");
      });

    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>
            {hasMissingSelections
              ? "Course and tee selections are required for all players before scoring can begin."
              : "Loading hole information..."}
          </Text>
          {hasMissingSelections && onNavigateToSettings && (
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
    <Screen>
      <View style={styles.container}>
        {/* Content: Either Team Chooser or Scoring UI */}
        <ErrorBoundary>
          {showChooser ? (
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
