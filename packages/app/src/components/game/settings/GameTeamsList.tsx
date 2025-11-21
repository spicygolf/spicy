import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { DraxProvider, DraxScrollView, DraxView } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { RoundToGame } from "spicylib/schema";
import {
  ListOfRoundToTeams,
  ListOfTeams,
  RoundToTeam,
  Team,
  TeamsConfig,
} from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { Button, Input, Text } from "@/ui";
import { ensureGameHoles } from "@/utils/gameTeams";

interface PlayerRoundItem {
  id: string;
  roundToGame: RoundToGame;
  playerName: string;
  handicap?: string;
}

interface TeamSection {
  teamNumber: number;
  teamName: string;
  players: PlayerRoundItem[];
}

interface RotationOption {
  value: number;
  label: string;
  description: string;
}

const ROTATION_OPTIONS: RotationOption[] = [
  { value: 0, label: "Never", description: "Teams stay the same all game" },
  { value: 1, label: "Every 1", description: "Teams change every hole" },
  { value: 3, label: "Every 3", description: "Teams change every 3 holes" },
  { value: 6, label: "Every 6", description: "Teams change every 6 holes" },
  {
    value: -1,
    label: "Custom",
    description: "Enter custom rotation frequency",
  },
];

export function GameTeamsList() {
  const { game } = useGameContext();
  const { theme } = useUnistyles();

  const [showRotationPicker, setShowRotationPicker] = useState(false);
  const [customRotateValue, setCustomRotateValue] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const hasTeamsConfig = useMemo(() => {
    if (!game?.scope?.$isLoaded) return false;
    return (
      game.scope.$jazz.has("teamsConfig") && game.scope.teamsConfig?.$isLoaded
    );
  }, [game]);

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

  const allPlayerRounds = useMemo(() => {
    if (!game?.rounds?.$isLoaded) return [];

    const items: PlayerRoundItem[] = [];
    for (const roundToGame of game.rounds) {
      if (!roundToGame?.$isLoaded || !roundToGame.round?.$isLoaded) continue;

      const playerId = roundToGame.round.playerId;

      let player = null;
      if (game.players?.$isLoaded) {
        for (const p of game.players) {
          if (p?.$isLoaded && p.$jazz.id === playerId) {
            player = p;
            break;
          }
        }
      }
      if (!player) continue;

      items.push({
        id: roundToGame.$jazz.id,
        roundToGame,
        playerName: player.name,
        handicap: roundToGame.handicapIndex,
      });
    }
    return items;
  }, [game]);

  const getCurrentTeamAssignments = useCallback((): Map<string, number> => {
    const assignments = new Map<string, number>();

    if (!game?.holes?.$isLoaded) {
      return assignments;
    }

    const firstHole = game.holes[0];
    if (!firstHole?.$isLoaded) {
      return assignments;
    }

    if (!firstHole.teams?.$isLoaded) {
      return assignments;
    }

    for (const team of firstHole.teams) {
      if (!team?.$isLoaded) continue;

      if (!team.rounds?.$isLoaded) continue;

      const teamNumber = Number.parseInt(team.team, 10);
      if (Number.isNaN(teamNumber)) continue;

      for (const roundToTeam of team.rounds) {
        if (!roundToTeam?.$isLoaded || !roundToTeam.roundToGame?.$isLoaded)
          continue;
        assignments.set(roundToTeam.roundToGame.$jazz.id, teamNumber);
      }
    }

    return assignments;
  }, [game]);

  const [teamAssignments, setTeamAssignments] = useState<Map<string, number>>(
    () => getCurrentTeamAssignments(),
  );

  useMemo(() => {
    const current = getCurrentTeamAssignments();
    if (current.size > 0) {
      setTeamAssignments(current);
    }
  }, [getCurrentTeamAssignments]);

  const teamSections = useMemo((): TeamSection[] => {
    const sections: TeamSection[] = [];

    for (let i = 1; i <= teamCount; i++) {
      const players = allPlayerRounds.filter(
        (p) => teamAssignments.get(p.id) === i,
      );
      sections.push({
        teamNumber: i,
        teamName: `Team ${i}`,
        players,
      });
    }

    const unassignedPlayers = allPlayerRounds.filter(
      (p) => !teamAssignments.has(p.id),
    );
    if (unassignedPlayers.length > 0) {
      sections.push({
        teamNumber: 0,
        teamName: "Unassigned",
        players: unassignedPlayers,
      });
    }

    return sections;
  }, [allPlayerRounds, teamAssignments, teamCount]);

  const saveTeamAssignmentsToGame = useCallback(
    async (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded) {
        return;
      }

      // Ensure holes exist - create them if they don't
      ensureGameHoles(game);

      // Load all holes first (level-by-level as per Jazz rules)
      // @ts-expect-error - TypeScript requires resolve but we're loading the list itself
      await game.holes.$jazz.ensureLoaded({});
      for (const hole of game.holes) {
        if (!hole?.$isLoaded) {
          // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
          await hole.$jazz.ensureLoaded({});
        }
      }

      for (const hole of game.holes) {
        if (!hole?.$isLoaded) {
          continue;
        }

        const newTeams = ListOfTeams.create([], { owner: hole.$jazz.owner });

        for (let i = 1; i <= teamCount; i++) {
          const teamPlayers = allPlayerRounds.filter(
            (p) => assignments.get(p.id) === i,
          );

          if (teamPlayers.length === 0) continue;

          const roundToTeams = ListOfRoundToTeams.create([], {
            owner: hole.$jazz.owner,
          });

          for (const player of teamPlayers) {
            const roundToTeam = RoundToTeam.create(
              { roundToGame: player.roundToGame },
              { owner: hole.$jazz.owner },
            );
            roundToTeams.$jazz.push(roundToTeam);
          }

          const team = Team.create(
            {
              team: `${i}`,
              rounds: roundToTeams,
            },
            { owner: hole.$jazz.owner },
          );

          newTeams.$jazz.push(team);
        }

        hole.$jazz.set("teams", newTeams);
      }
    },
    [game, allPlayerRounds, teamCount],
  );

  const handleTossBalls = useCallback(async () => {
    const shuffled = [...allPlayerRounds].sort(() => Math.random() - 0.5);
    const newAssignments = new Map<string, number>();

    shuffled.forEach((player, index) => {
      const teamNumber = (index % teamCount) + 1;
      newAssignments.set(player.id, teamNumber);
    });

    setTeamAssignments(newAssignments);
    await saveTeamAssignmentsToGame(newAssignments);
  }, [allPlayerRounds, teamCount, saveTeamAssignmentsToGame]);

  const handleDrop = useCallback(
    async (playerId: string, targetTeam: number) => {
      const newAssignments = new Map(teamAssignments);
      if (targetTeam === 0) {
        newAssignments.delete(playerId);
      } else {
        newAssignments.set(playerId, targetTeam);
      }
      setTeamAssignments(newAssignments);
      await saveTeamAssignmentsToGame(newAssignments);
    },
    [teamAssignments, saveTeamAssignmentsToGame],
  );

  const getRotationLabel = useCallback(() => {
    if (rotateEvery === undefined) return "Not set";
    if (rotateEvery === 0) return "Never";
    if (rotateEvery === 1) return "Every hole";
    return `Every ${rotateEvery} holes`;
  }, [rotateEvery]);

  const handleRotationChange = useCallback(
    async (value: number) => {
      if (!game?.scope?.$isLoaded) return;

      // Handle "Custom" option
      if (value === -1) {
        setShowCustomInput(true);
        return;
      }

      setShowCustomInput(false);
      setShowRotationPicker(false);

      // Create or update teams config
      if (!game.scope.$jazz.has("teamsConfig")) {
        const config = TeamsConfig.create(
          {
            rotateEvery: value,
            teamCount: teamCount,
          },
          { owner: game.$jazz.owner },
        );
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        game.scope.teamsConfig.$jazz.set("rotateEvery", value);
      }
    },
    [game, teamCount],
  );

  const handleCustomRotateSubmit = useCallback(async () => {
    const numValue = Number.parseInt(customRotateValue, 10);
    if (Number.isNaN(numValue) || numValue < 0) {
      return;
    }

    if (!game?.scope?.$isLoaded) return;

    // Create or update teams config with custom value
    if (!game.scope.$jazz.has("teamsConfig")) {
      const config = TeamsConfig.create(
        {
          rotateEvery: numValue,
          teamCount: teamCount,
        },
        { owner: game.$jazz.owner },
      );
      game.scope.$jazz.set("teamsConfig", config);
    } else if (game.scope.teamsConfig?.$isLoaded) {
      game.scope.teamsConfig.$jazz.set("rotateEvery", numValue);
    }

    setShowCustomInput(false);
    setShowRotationPicker(false);
    setCustomRotateValue("");
  }, [customRotateValue, game, teamCount]);

  // Initialize teams config if not present
  if (!hasTeamsConfig && game?.scope?.$isLoaded) {
    const config = TeamsConfig.create(
      {
        rotateEvery: 0,
        teamCount: 2,
      },
      { owner: game.$jazz.owner },
    );
    game.scope.$jazz.set("teamsConfig", config);
  }

  return (
    <DraxProvider>
      <View style={styles.container}>
        {/* Compact Rotation Picker Row */}
        <Pressable
          style={styles.rotationPickerRow}
          onPress={() => setShowRotationPicker(true)}
        >
          <Text style={styles.rotationPickerLabel}>Teams Rotate:</Text>
          <View style={styles.rotationPickerValue}>
            <Text style={styles.rotationPickerValueText}>
              {getRotationLabel()}
            </Text>
            <FontAwesome6
              name="chevron-right"
              iconStyle="solid"
              size={14}
              color={theme.colors.secondary}
            />
          </View>
        </Pressable>

        {/* Rotation Picker Modal */}
        <Modal
          visible={showRotationPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRotationPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowRotationPicker(false);
              setShowCustomInput(false);
            }}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Teams Rotate</Text>
                <Pressable
                  onPress={() => {
                    setShowRotationPicker(false);
                    setShowCustomInput(false);
                  }}
                >
                  <FontAwesome6
                    name="xmark"
                    iconStyle="solid"
                    size={20}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>

              <View style={styles.rotationOptions}>
                {ROTATION_OPTIONS.map((option) => {
                  const isSelected =
                    option.value === -1
                      ? showCustomInput
                      : rotateEvery === option.value;
                  const isCustomValue =
                    rotateEvery !== undefined &&
                    rotateEvery !== 0 &&
                    rotateEvery !== 1 &&
                    rotateEvery !== 3 &&
                    rotateEvery !== 6;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.rotationOption,
                        (isSelected ||
                          (option.value === -1 && isCustomValue)) &&
                          styles.rotationOptionSelected,
                      ]}
                      onPress={() => handleRotationChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.rotationOptionLabel,
                          (isSelected ||
                            (option.value === -1 && isCustomValue)) &&
                            styles.rotationOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                        {option.value === -1 &&
                          isCustomValue &&
                          ` (${rotateEvery})`}
                      </Text>
                      <Text
                        style={[
                          styles.rotationOptionDesc,
                          (isSelected ||
                            (option.value === -1 && isCustomValue)) &&
                            styles.rotationOptionDescSelected,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {showCustomInput && (
                <View style={styles.customInputContainer}>
                  <View style={styles.customInputRow}>
                    <Input
                      label="Rotation frequency (holes)"
                      keyboardType="number-pad"
                      value={customRotateValue}
                      onChangeText={setCustomRotateValue}
                      placeholder="e.g., 9"
                    />
                    <View style={styles.customInputButton}>
                      <Button label="Set" onPress={handleCustomRotateSubmit} />
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Team Assignments Section - only show if rotateEvery === 0 */}
        {rotateEvery === 0 ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Team Assignments</Text>
              <Button label="Toss Balls" onPress={handleTossBalls} />
            </View>

            {allPlayerRounds.length === 0 ? (
              <View style={styles.centerContainer}>
                <View style={styles.emptyIcon}>
                  <FontAwesome6
                    name="user-group"
                    iconStyle="solid"
                    size={48}
                    color={theme.colors.secondary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No Players Yet</Text>
                <Text style={styles.emptyText}>
                  Add players in the Players tab to assign them to teams.
                </Text>
              </View>
            ) : (
              <DraxScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={true}
              >
                {teamSections.map((section) => (
                  <DraxView
                    key={section.teamNumber}
                    style={styles.teamSection}
                    onReceiveDragDrop={(event) => {
                      if (event.dragged.payload) {
                        handleDrop(
                          event.dragged.payload as string,
                          section.teamNumber,
                        );
                      }
                    }}
                    receivingStyle={styles.teamSectionReceiving}
                  >
                    <View
                      style={[
                        styles.teamHeader,
                        section.teamNumber === 0 && styles.unassignedHeader,
                      ]}
                    >
                      <Text style={styles.teamHeaderText}>
                        {section.teamName}
                      </Text>
                      <Text style={styles.playerCount}>
                        {section.players.length} player
                        {section.players.length !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    <View style={styles.dropZone}>
                      {section.players.length > 0 ? (
                        <View style={styles.playersList}>
                          {section.players.map((player) => {
                            return (
                              <DraxView
                                key={player.id}
                                style={styles.playerItem}
                                draggingStyle={styles.playerDragging}
                                dragReleasedStyle={styles.playerReleased}
                                dragPayload={player.id}
                                renderContent={({ viewState }) => (
                                  <View
                                    style={[
                                      styles.playerContent,
                                      viewState?.dragStatus === 2 &&
                                        styles.playerContentDragging,
                                    ]}
                                  >
                                    <View style={styles.dragHandle}>
                                      <FontAwesome6
                                        name="grip-lines"
                                        iconStyle="solid"
                                        size={16}
                                        color={theme.colors.secondary}
                                      />
                                    </View>
                                    <View style={styles.playerInfo}>
                                      <Text style={styles.playerName}>
                                        {player.playerName}
                                      </Text>
                                      {player.handicap && (
                                        <Text style={styles.handicap}>
                                          HI: {player.handicap}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                )}
                              />
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.emptyTeam}>
                          <Text style={styles.emptyTeamText}>
                            Drag players here
                          </Text>
                        </View>
                      )}
                    </View>
                  </DraxView>
                ))}
              </DraxScrollView>
            )}
          </>
        ) : (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIcon}>
              <FontAwesome6
                name="arrows-rotate"
                iconStyle="solid"
                size={48}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={styles.emptyTitle}>Rotating Teams</Text>
            <Text style={styles.emptyText}>
              Teams will be chosen during gameplay every {rotateEvery} hole
              {rotateEvery !== 1 ? "s" : ""}.
            </Text>
          </View>
        )}
      </View>
    </DraxProvider>
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
  emptyIcon: {
    marginBottom: theme.gap(2),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  rotationPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  rotationPickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  rotationPickerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  rotationPickerValueText: {
    fontSize: 16,
    color: theme.colors.secondary,
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
    maxWidth: 500,
    maxHeight: "80%",
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
  rotationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.gap(1.5),
  },
  rotationOption: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  rotationOptionSelected: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  rotationOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  rotationOptionLabelSelected: {
    color: theme.colors.action,
  },
  rotationOptionDesc: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  rotationOptionDescSelected: {
    color: theme.colors.action,
  },
  customInputContainer: {
    marginTop: theme.gap(2),
    padding: theme.gap(2),
    backgroundColor: `${theme.colors.action}05`,
    borderRadius: 8,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.gap(1),
  },
  customInputButton: {
    marginBottom: theme.gap(1.25),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    paddingTop: theme.gap(2),
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(4),
  },
  teamSection: {
    marginBottom: theme.gap(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  teamSectionReceiving: {
    borderWidth: 2,
    borderColor: theme.colors.action,
    backgroundColor: `${theme.colors.action}10`,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(2),
    backgroundColor: "transparent",
  },
  unassignedHeader: {
    backgroundColor: "transparent",
  },
  teamHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  playerCount: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  dropZone: {
    minHeight: 80,
  },
  playersList: {
    backgroundColor: theme.colors.background,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    backgroundColor: theme.colors.background,
    width: "100%",
  },
  playerContentDragging: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    opacity: 0.9,
  },
  playerDragging: {
    opacity: 0.3,
  },
  playerReleased: {
    opacity: 1,
  },
  dragHandle: {
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.gap(2),
  },
  playerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  handicap: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  emptyTeam: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingVertical: theme.gap(4),
    paddingHorizontal: theme.gap(2),
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    minHeight: 80,
    justifyContent: "center",
  },
  emptyTeamText: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontStyle: "italic",
    textAlign: "center",
  },
}));
