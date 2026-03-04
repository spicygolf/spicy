import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getGameSpecField } from "spicylib/scoring";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { extractBets } from "@/components/game/leaderboard";
import {
  ChangeTeamsModal,
  type GroupPickerItem,
} from "@/components/game/scoring";
import { useGameContext } from "@/contexts/GameContext";
import {
  useAutoPress,
  useCurrentHole,
  useGameInitialization,
  useHoleInitialization,
  useHoleNavigation,
  useScoreManagement,
  useSettlement,
} from "@/hooks";
import { useTeamsMode } from "@/hooks/useTeamsMode";
import { Button, Screen, Text } from "@/ui";
import { usePerfRenderCount } from "@/utils/perfTrace";
import { RapidEntryView } from "./RapidEntryView";
import { ScoringView } from "./ScoringView";
import { SummaryView } from "./SummaryView";
import { TeamChooserView } from "./TeamChooserView";
import { useTeamManagement } from "./useTeamManagement";

interface GameScoringProps {
  onNavigateToSettings?: () => void;
}

export function GameScoring({ onNavigateToSettings }: GameScoringProps) {
  usePerfRenderCount("GameScoring");

  // Use shared game and scoreboard from context
  const {
    scoringGame: game,
    scoreboard,
    scoringContext,
    selectedGroupId,
    setSelectedGroupId,
  } = useGameContext();

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

  // Teams mode — determines if teams button should be disabled in toolbar
  const { isSeamlessMode } = useTeamsMode(game);

  const bets = extractBets(game, scoringContext?.gameSpec);

  const settlement = useSettlement(game, scoreboard, scoringContext, bets);
  const payouts = settlement?.payouts ?? null;

  // Press bet management (auto + manual)
  const { runAutoPress, createManualPress, hasMatchBets } = useAutoPress(
    game,
    scoreboard,
    bets,
    currentHoleIndex,
  );

  // Rapid per-player score entry mode
  const [rapidEntryMode, setRapidEntryMode] = useState(false);

  // Build GroupPickerItem[] from game.scope.groups.
  // Computed directly — Jazz objects are reactive proxies so useMemo with
  // CoValue dependencies would cache stale results during progressive loading.
  const groupPickerItems: GroupPickerItem[] = (() => {
    if (!game?.$isLoaded || !game.scope?.$isLoaded) return [];
    if (!game.scope.$jazz.has("groups") || !game.scope.groups?.$isLoaded) {
      return [];
    }

    // Only show picker if multi_group is enabled
    const multiGroupValue = getGameSpecField(game, "multi_group");
    if (multiGroupValue !== true && multiGroupValue !== "true") return [];

    // Build rtgId → last name initial lookup from game.rounds + game.players
    const rtgPlayerName = new Map<string, string>();
    if (game.rounds?.$isLoaded && game.players?.$isLoaded) {
      for (const rtg of game.rounds as Iterable<(typeof game.rounds)[number]>) {
        if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
        const playerId = rtg.round.playerId;
        for (const p of game.players as Iterable<
          (typeof game.players)[number]
        >) {
          if (p?.$isLoaded && p.$jazz.id === playerId && p.name) {
            // Use first initial + last name, e.g. "B Anderson"
            const parts = p.name.trim().split(/\s+/);
            const short =
              parts.length > 1
                ? `${parts[0][0]} ${parts[parts.length - 1]}`
                : parts[0];
            rtgPlayerName.set(rtg.$jazz.id, short);
            break;
          }
        }
      }
    }

    const items: GroupPickerItem[] = [];
    for (let i = 0; i < game.scope.groups.length; i++) {
      const group = game.scope.groups[i];
      if (!group?.$isLoaded) continue;

      // Build player names string from group rounds
      const names: string[] = [];
      if (group.rounds?.$isLoaded) {
        for (const rtg of group.rounds as Iterable<
          (typeof group.rounds)[number]
        >) {
          if (!rtg?.$isLoaded) continue;
          const name = rtgPlayerName.get(rtg.$jazz.id);
          if (name) names.push(name);
        }
      }

      const groupNum = `${i + 1}`;
      const shortLabel = group.teeTime || groupNum;
      const playerNames = names.length > 0 ? names.join(" \u2022 ") : "";
      const label = playerNames ? `${shortLabel} — ${playerNames}` : shortLabel;
      items.push({ id: group.$jazz.id, shortLabel, label });
    }
    return items;
  })();

  // Clear stale selectedGroupId if the group no longer exists
  if (
    selectedGroupId &&
    !groupPickerItems.some((g) => g.id === selectedGroupId)
  ) {
    // Schedule for next tick — can't setState during render
    queueMicrotask(() => setSelectedGroupId(""));
  }

  // Build the Set of RoundToGame IDs for the selected group
  const groupRoundIds: Set<string> | undefined = (() => {
    if (!selectedGroupId) return undefined;
    if (!game?.$isLoaded || !game.scope?.$isLoaded) return undefined;
    if (!game.scope.$jazz.has("groups") || !game.scope.groups?.$isLoaded) {
      return undefined;
    }

    for (let i = 0; i < game.scope.groups.length; i++) {
      const group = game.scope.groups[i];
      if (!group?.$isLoaded || group.$jazz.id !== selectedGroupId) continue;
      if (!group.rounds?.$isLoaded) continue;

      const ids = new Set<string>();
      for (const rtg of group.rounds as Iterable<
        (typeof group.rounds)[number]
      >) {
        if (rtg?.$isLoaded) {
          ids.add(rtg.$jazz.id);
        }
      }
      return ids;
    }
    return undefined;
  })();

  if (!game) {
    return null;
  }

  // Check loading state first, before evaluating derived data like holesList
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
        {/* Content: Rapid Entry, Summary, Team Chooser, or Scoring UI */}
        <ErrorBoundary>
          {rapidEntryMode ? (
            <RapidEntryView
              game={game}
              holesList={holesList}
              groupRoundIds={groupRoundIds}
              onExit={() => setRapidEntryMode(false)}
            />
          ) : showSummary ? (
            <SummaryView
              game={game}
              scoreboard={scoreboard}
              totalHoles={holesList.length}
              onPrevHole={handlePrevHole}
              onNextHole={handleNextHole}
              payouts={payouts}
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
              holesList={holesList}
              scoreboard={scoreboard}
              scoringContext={scoringContext}
              onPrevHole={handlePrevHole}
              onNextHole={() => {
                runAutoPress();
                handleNextHole();
              }}
              onScoreChange={handleScoreChange}
              onUnscore={handleUnscore}
              onChangeTeams={() => setShowChangeTeamsModal(true)}
              teamsDisabled={isSeamlessMode}
              groups={groupPickerItems}
              selectedGroupId={selectedGroupId}
              onGroupChange={setSelectedGroupId}
              groupRoundIds={groupRoundIds}
              onRapidEntry={() => setRapidEntryMode(true)}
              hasMatchBets={hasMatchBets}
              onManualPress={createManualPress}
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
