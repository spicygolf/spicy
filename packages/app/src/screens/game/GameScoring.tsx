import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { TeamChooser } from "@/components/game/TeamChooser";
import { useGameContext } from "@/contexts/GameContext";
import { Button, Screen, Text } from "@/ui";
import {
  ensureGameHoles,
  ensureHoleHasTeams,
  getTeamAssignmentsFromHole,
  saveTeamAssignmentsToHole,
  shouldShowTeamChooser,
} from "@/utils/gameTeams";

export function GameScoring() {
  const { game } = useGameContext();
  const { theme } = useUnistyles();
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [showChooser, setShowChooser] = useState(false);
  const [showChangeTeamsModal, setShowChangeTeamsModal] = useState(false);
  const [changeTeamsScope, setChangeTeamsScope] = useState<
    "current" | "period"
  >("period");

  const rotateEvery = useMemo(() => {
    if (!game?.scope?.$isLoaded || !game.scope.$jazz.has("teamsConfig")) {
      return undefined;
    }
    return game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.rotateEvery
      : undefined;
  }, [game]);

  const teamCount = useMemo(() => {
    if (!game?.scope?.$isLoaded || !game.scope.$jazz.has("teamsConfig")) {
      return 2;
    }
    return game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.teamCount
      : 2;
  }, [game]);

  const holesList = useMemo(() => {
    if (!game?.holes?.$isLoaded) return [];
    return game.holes
      .map((h) => (h?.$isLoaded ? h.hole : null))
      .filter(Boolean) as string[];
  }, [game]);

  const currentHole = useMemo(() => {
    if (!game?.holes?.$isLoaded || currentHoleIndex >= game.holes.length) {
      return null;
    }
    const hole = game.holes[currentHoleIndex];
    return hole?.$isLoaded ? hole : null;
  }, [game, currentHoleIndex]);

  const currentHoleNumber = currentHole?.hole || "1";

  // Load current hole's teams and check if we need to show the team chooser
  useEffect(() => {
    async function loadCurrentHole() {
      if (!game?.$isLoaded || rotateEvery === undefined) return;

      // First ensure holes array is loaded
      if (!game.holes?.$isLoaded) {
        await game.$jazz.ensureLoaded({
          resolve: { holes: { $each: true } },
        });
      }

      if (!game.holes?.$isLoaded) {
        return;
      }

      // Ensure holes exist - create them if they don't
      ensureGameHoles(game);

      const hole = game.holes[currentHoleIndex];

      // If hole doesn't exist or teams aren't loaded, load them
      if (hole?.$isLoaded && !hole.teams?.$isLoaded) {
        // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
        await hole.teams.$jazz.ensureLoaded({});
      }

      // Now load each team and its rounds
      if (hole?.$isLoaded && hole.teams?.$isLoaded) {
        for (const team of hole.teams) {
          if (!team?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            await team.$jazz.ensureLoaded({});
          }

          // Load the rounds list
          if (team?.$isLoaded && !team.rounds?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            await team.rounds.$jazz.ensureLoaded({});
          }

          // Load each round object
          // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
          if (team?.rounds?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            for (const roundToTeam of team.rounds) {
              if (!roundToTeam?.$isLoaded) {
                await roundToTeam.$jazz.ensureLoaded({
                  resolve: {
                    roundToGame: true,
                  },
                });
              } else if (
                roundToTeam?.$isLoaded &&
                !roundToTeam.roundToGame?.$isLoaded
              ) {
                await roundToTeam.$jazz.ensureLoaded({
                  resolve: {
                    roundToGame: true,
                  },
                });
              }
            }
          }
        }
      }

      if (!game.holes?.$isLoaded) return;

      // Try to ensure hole has teams (will copy from hole 1 if rotateEvery=0)
      ensureHoleHasTeams(game, game.holes, currentHoleIndex, rotateEvery);

      // Determine if we need to show the chooser
      const needsChooser = shouldShowTeamChooser(
        game.holes,
        currentHoleIndex,
        rotateEvery,
        game,
      );

      setShowChooser(needsChooser);
    }

    loadCurrentHole();
  }, [game, currentHoleIndex, rotateEvery]);

  const handlePrevHole = useCallback(() => {
    setCurrentHoleIndex((prev) => {
      if (prev === 0) return holesList.length - 1;
      return prev - 1;
    });
  }, [holesList.length]);

  const handleNextHole = useCallback(() => {
    setCurrentHoleIndex((prev) => {
      if (prev === holesList.length - 1) return 0;
      return prev + 1;
    });
  }, [holesList.length]);

  const handleChangeTeamsConfirm = useCallback(() => {
    if (!game?.holes?.$isLoaded || rotateEvery === undefined) return;

    // Clear teams for the selected scope
    const holesToClear: number[] = [];

    if (changeTeamsScope === "current") {
      // Just current hole
      holesToClear.push(currentHoleIndex);
    } else {
      // Rest of rotation period
      if (rotateEvery > 0) {
        const rotationPeriodStart =
          Math.floor(currentHoleIndex / rotateEvery) * rotateEvery;
        const rotationPeriodEnd = Math.min(
          rotationPeriodStart + rotateEvery,
          holesList.length,
        );
        for (let i = currentHoleIndex; i < rotationPeriodEnd; i++) {
          holesToClear.push(i);
        }
      } else {
        // rotateEvery === 0, just current hole
        holesToClear.push(currentHoleIndex);
      }
    }

    // Clear teams on selected holes
    for (const holeIndex of holesToClear) {
      const hole = game.holes[holeIndex];
      if (hole?.$isLoaded) {
        const { ListOfTeams } = require("spicylib/schema");
        const emptyTeams = ListOfTeams.create([], { owner: hole.$jazz.owner });
        hole.$jazz.set("teams", emptyTeams);
      }
    }

    // Close modal and show chooser
    setShowChangeTeamsModal(false);
    setShowChooser(true);
  }, [game, rotateEvery, changeTeamsScope, currentHoleIndex, holesList.length]);

  const handleTeamAssignmentsChange = useCallback(
    (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded || rotateEvery === undefined) return;

      // Check if all players are assigned
      const totalPlayers = game.rounds?.$isLoaded ? game.rounds.length : 0;
      const assignedPlayers = assignments.size;
      const allPlayersAssigned = assignedPlayers === totalPlayers;

      // When rotateEvery > 0, save assignments to all holes in the current rotation period
      if (rotateEvery > 0) {
        // Calculate the start of the current rotation period
        const rotationPeriodStart =
          Math.floor(currentHoleIndex / rotateEvery) * rotateEvery;
        const rotationPeriodEnd = Math.min(
          rotationPeriodStart + rotateEvery,
          holesList.length,
        );

        // Save to all holes in this rotation period
        for (let i = rotationPeriodStart; i < rotationPeriodEnd; i++) {
          saveTeamAssignmentsToHole(
            game,
            game.holes,
            i,
            assignments,
            teamCount,
          );
        }
      } else {
        // rotateEvery === 0: teams never rotate, just save to current hole
        saveTeamAssignmentsToHole(
          game,
          game.holes,
          currentHoleIndex,
          assignments,
          teamCount,
        );
      }

      // Hide the chooser only if all players are assigned
      if (allPlayersAssigned) {
        setShowChooser(false);
      }
    },
    [game, currentHoleIndex, teamCount, rotateEvery, holesList.length],
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

  return (
    <Screen>
      <View style={styles.container}>
        {/* Hole Navigation */}
        <View style={styles.holeNav}>
          <Button label="←" onPress={handlePrevHole} />
          <View style={styles.holeInfo}>
            <Text style={styles.holeNumber}>Hole {currentHoleNumber}</Text>
          </View>
          <Button label="→" onPress={handleNextHole} />
        </View>

        {/* Content: Either Team Chooser or Scoring UI */}
        <View style={styles.content}>
          {showChooser ? (
            <View style={styles.chooserContainer}>
              <Text style={styles.chooserTitle}>Choose Teams</Text>
              <TeamChooser
                game={game}
                teamCount={teamCount}
                initialAssignments={getTeamAssignmentsFromHole(
                  currentHole || undefined,
                )}
                onAssignmentsChange={handleTeamAssignmentsChange}
                showTossBalls={true}
              />
            </View>
          ) : (
            <View style={styles.scoringContainer}>
              <View style={styles.scoringHeader}>
                <Text style={styles.debugTitle}>
                  Scoring UI for Hole {currentHoleNumber}
                </Text>
                <Button
                  label="Change Teams"
                  onPress={() => setShowChangeTeamsModal(true)}
                />
              </View>
              <Text style={styles.debugSection}>Teams Debug Info:</Text>
              {currentHole?.teams?.$isLoaded ? (
                <>
                  <Text style={styles.debugText}>
                    Teams count: {currentHole.teams.length}
                  </Text>
                  {currentHole.teams.map((team) => {
                    if (!team?.$isLoaded) return null;
                    return (
                      <View key={team.$jazz.id} style={styles.debugTeam}>
                        <Text style={styles.debugTeamTitle}>
                          Team {team.team}:
                        </Text>
                        {team.rounds?.$isLoaded ? (
                          team.rounds.map((roundToTeam) => {
                            if (!roundToTeam?.$isLoaded) return null;
                            const rtg = roundToTeam.roundToGame;
                            if (!rtg?.$isLoaded) return null;
                            const round = rtg.round;
                            if (!round?.$isLoaded) return null;

                            // Get player name
                            let playerName = "Unknown";
                            if (game?.players?.$isLoaded) {
                              for (const p of game.players) {
                                if (
                                  p?.$isLoaded &&
                                  p.$jazz.id === round.playerId
                                ) {
                                  playerName = p.name;
                                  break;
                                }
                              }
                            }

                            return (
                              <Text
                                key={roundToTeam.$jazz.id}
                                style={styles.debugPlayer}
                              >
                                • {playerName} (HI: {rtg.handicapIndex || "N/A"}
                                )
                              </Text>
                            );
                          })
                        ) : (
                          <Text style={styles.debugText}>
                            Rounds not loaded
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.debugText}>No teams loaded</Text>
              )}
            </View>
          )}
        </View>

        {/* Change Teams Modal */}
        <Modal
          visible={showChangeTeamsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowChangeTeamsModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowChangeTeamsModal(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Teams</Text>
                <Pressable onPress={() => setShowChangeTeamsModal(false)}>
                  <FontAwesome6
                    name="xmark"
                    iconStyle="solid"
                    size={20}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>

              <Text style={styles.modalDescription}>
                Clear team assignments and choose new teams for:
              </Text>

              <View style={styles.scopeOptions}>
                <Pressable
                  style={[
                    styles.scopeOption,
                    changeTeamsScope === "current" &&
                      styles.scopeOptionSelected,
                  ]}
                  onPress={() => setChangeTeamsScope("current")}
                >
                  <FontAwesome6
                    name={
                      changeTeamsScope === "current" ? "circle-dot" : "circle"
                    }
                    iconStyle="regular"
                    size={20}
                    color={
                      changeTeamsScope === "current"
                        ? theme.colors.action
                        : theme.colors.secondary
                    }
                  />
                  <View style={styles.scopeOptionText}>
                    <Text style={styles.scopeOptionLabel}>
                      Current Hole Only
                    </Text>
                    <Text style={styles.scopeOptionDesc}>
                      Hole {currentHoleNumber}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.scopeOption,
                    changeTeamsScope === "period" && styles.scopeOptionSelected,
                  ]}
                  onPress={() => setChangeTeamsScope("period")}
                >
                  <FontAwesome6
                    name={
                      changeTeamsScope === "period" ? "circle-dot" : "circle"
                    }
                    iconStyle="regular"
                    size={20}
                    color={
                      changeTeamsScope === "period"
                        ? theme.colors.action
                        : theme.colors.secondary
                    }
                  />
                  <View style={styles.scopeOptionText}>
                    <Text style={styles.scopeOptionLabel}>
                      {rotateEvery === 0
                        ? "All Holes"
                        : "Rest of Rotation Period"}
                    </Text>
                    <Text style={styles.scopeOptionDesc}>
                      {rotateEvery === 0
                        ? "Teams never rotate"
                        : `Holes ${currentHoleNumber} - ${Math.min(
                            Math.floor(currentHoleIndex / (rotateEvery || 1)) *
                              (rotateEvery || 1) +
                              (rotateEvery || 1),
                            holesList.length,
                          )}`}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  label="Cancel"
                  onPress={() => setShowChangeTeamsModal(false)}
                />
                <Button label="Change" onPress={handleChangeTeamsConfirm} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  holeNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navButton: {
    minWidth: 60,
  },
  holeInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  holeNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  chooserContainer: {
    flex: 1,
    paddingTop: theme.gap(2),
  },
  chooserTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  scoringContainer: {
    flex: 1,
    padding: theme.gap(2),
  },
  scoringHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  debugSection: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: theme.gap(2),
    marginBottom: theme.gap(1),
  },
  debugText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(0.5),
  },
  debugTeam: {
    marginTop: theme.gap(1.5),
    marginBottom: theme.gap(1),
    paddingLeft: theme.gap(2),
  },
  debugTeamTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
  },
  debugPlayer: {
    fontSize: 14,
    marginLeft: theme.gap(1),
    marginBottom: theme.gap(0.25),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
  },
  scopeOptions: {
    gap: theme.gap(1.5),
    marginBottom: theme.gap(3),
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    gap: theme.gap(1.5),
  },
  scopeOptionSelected: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  scopeOptionText: {
    flex: 1,
  },
  scopeOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
  },
  scopeOptionDesc: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.gap(1.5),
  },
}));
