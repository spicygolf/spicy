import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ChangeTeamsModal } from "@/components/game/scoring";
import { useGameContext } from "@/contexts/GameContext";
import { useHoleNavigation, useScoreManagement } from "@/hooks";
import { Screen, Text } from "@/ui";
import { ScoringView } from "./ScoringView";
import { TeamChooserView } from "./TeamChooserView";
import { useTeamManagement } from "./useTeamManagement";

export function GameScoring() {
  const { game } = useGameContext();

  // Hook 1: Hole navigation (current hole, prev/next)
  const {
    currentHoleIndex,
    currentHole,
    currentHoleNumber,
    holeInfo,
    holesList,
    handlePrevHole,
    handleNextHole,
  } = useHoleNavigation(game);

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

  // Hook 3: Score management (Jazz database updates)
  const { handleScoreChange } = useScoreManagement(
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
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.message}>Loading hole information...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Content: Either Team Chooser or Scoring UI */}
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
            onChangeTeams={() => setShowChangeTeamsModal(true)}
          />
        )}

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
  },
}));
