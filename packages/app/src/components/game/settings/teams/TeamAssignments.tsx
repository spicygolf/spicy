import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { DraxScrollView, DraxView } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, Text } from "@/ui";
import type { PlayerRoundItem, TeamSection } from "./types";

interface TeamAssignmentsProps {
  allPlayerRounds: PlayerRoundItem[];
  teamCount: number;
  teamAssignments: Map<string, number>;
  onDrop: (playerId: string, targetTeam: number) => void;
  onTossBalls: () => void;
  canAddTeam: boolean;
  onAddTeam: () => void;
  /** Minimum number of teams required by spec (undefined = no minimum) */
  specNumTeams?: number;
  /** Callback when a team is deleted */
  onDeleteTeam?: (teamNumber: number) => void;
}

/**
 * Create a URL-safe slug from a player name for use in testIDs
 */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function TeamAssignments({
  allPlayerRounds,
  teamCount,
  teamAssignments,
  onDrop,
  specNumTeams,
  onDeleteTeam,
  onTossBalls,
  canAddTeam,
  onAddTeam,
}: TeamAssignmentsProps) {
  const { theme } = useUnistyles();

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
    // Always show Unassigned section so players can be moved back to it
    sections.push({
      teamNumber: 0,
      teamName: "Unassigned",
      players: unassignedPlayers,
    });

    return sections;
  }, [allPlayerRounds, teamAssignments, teamCount]);

  if (allPlayerRounds.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Team Assignments</Text>
        <View style={styles.headerButtons}>
          {canAddTeam && (
            <Button label="Add Team" onPress={onAddTeam} variant="secondary" />
          )}
          <Button label="Toss Balls" onPress={onTossBalls} />
        </View>
      </View>

      <DraxScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        {teamSections.map((section) => {
          // Create testID: "team-1-dropzone", "team-2-dropzone", "team-unassigned-dropzone"
          const sectionTestId =
            section.teamNumber === 0
              ? "team-unassigned-dropzone"
              : `team-${section.teamNumber}-dropzone`;

          // A team can be deleted if:
          // 1. It's not "Unassigned" (teamNumber > 0)
          // 2. It's empty (no players)
          // 3. Current team count exceeds spec minimum (default to 2 if no spec)
          // 4. It's the last team (highest number) - to prevent gaps
          const minTeams = specNumTeams ?? 2; // Default to 2 teams minimum
          const canDeleteTeam =
            section.teamNumber > 0 &&
            section.players.length === 0 &&
            teamCount > minTeams &&
            section.teamNumber === teamCount; // Only allow deleting the last team

          return (
            <DraxView
              key={section.teamNumber}
              style={styles.teamSection}
              testID={sectionTestId}
              onReceiveDragDrop={(event) => {
                if (event.dragged.payload) {
                  onDrop(event.dragged.payload as string, section.teamNumber);
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
                <Text style={styles.teamHeaderText}>{section.teamName}</Text>
                <View style={styles.teamHeaderRight}>
                  {canDeleteTeam && onDeleteTeam && (
                    <Pressable
                      testID={`team-${section.teamNumber}-delete`}
                      onPress={() => onDeleteTeam(section.teamNumber)}
                      style={styles.deleteTeamButton}
                      hitSlop={8}
                    >
                      <FontAwesome6
                        name="trash"
                        iconStyle="solid"
                        size={14}
                        color={theme.colors.error}
                      />
                    </Pressable>
                  )}
                  <Text style={styles.playerCount}>
                    {section.players.length} player
                    {section.players.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.dropZone}>
                {section.players.length > 0 ? (
                  <View style={styles.playersList}>
                    {section.players.map((player) => {
                      // Create testID based on player name slug: "team-player-brad", "team-player-scott"
                      const playerSlug = slugify(player.playerName);
                      const playerTestId = `team-player-${playerSlug}`;

                      // Calculate next team for tap-to-cycle assignment
                      // Unassigned (0) -> Team 1, Team 1 -> Team 2, ..., Team N -> Unassigned
                      const currentTeam = section.teamNumber;
                      const nextTeam =
                        currentTeam >= teamCount ? 0 : currentTeam + 1;

                      return (
                        <View key={player.id} style={styles.playerItem}>
                          {/* Drag handle - only this area triggers drag */}
                          <DraxView
                            testID={`${playerTestId}-drag`}
                            style={styles.dragHandleContainer}
                            draggingStyle={styles.dragHandleDragging}
                            dragReleasedStyle={styles.dragHandleReleased}
                            hoverStyle={styles.hoverView}
                            dragPayload={player.id}
                            renderContent={({ viewState }) => (
                              <View
                                style={[
                                  styles.dragHandle,
                                  viewState?.dragStatus === 2 &&
                                    styles.dragHandleActive,
                                ]}
                              >
                                <FontAwesome6
                                  name="grip-lines"
                                  iconStyle="solid"
                                  size={16}
                                  color={theme.colors.secondary}
                                />
                              </View>
                            )}
                            renderHoverContent={() => (
                              <View style={styles.hoverContent}>
                                <View style={styles.dragHandle}>
                                  <FontAwesome6
                                    name="grip-lines"
                                    iconStyle="solid"
                                    size={16}
                                    color={theme.colors.secondary}
                                  />
                                </View>
                                <Text style={styles.hoverPlayerName}>
                                  {player.playerName}
                                </Text>
                                {player.handicap !== undefined && (
                                  <Text style={styles.hoverHandicap}>
                                    HI: {player.handicap}
                                  </Text>
                                )}
                              </View>
                            )}
                          />
                          {/* Player info - tappable to cycle teams */}
                          <Pressable
                            testID={playerTestId}
                            accessibilityLabel={playerTestId}
                            style={styles.playerInfo}
                            onPress={() => onDrop(player.id, nextTeam)}
                          >
                            <Text style={styles.playerName}>
                              {player.playerName}
                            </Text>
                            {player.handicap !== undefined && (
                              <Text style={styles.handicap}>
                                HI: {player.handicap}
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyTeam}>
                    <Text style={styles.emptyTeamText}>Drag players here</Text>
                  </View>
                )}
              </View>
            </DraxView>
          );
        })}
      </DraxScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingTop: theme.gap(2),
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  teamHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  deleteTeamButton: {
    padding: theme.gap(1),
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
    backgroundColor: theme.colors.background,
  },
  dragHandleContainer: {
    paddingVertical: theme.gap(1),
    paddingLeft: theme.gap(2),
    paddingRight: theme.gap(1),
  },
  dragHandleDragging: {
    opacity: 0.3,
  },
  dragHandleReleased: {
    opacity: 1,
  },
  dragHandle: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandleActive: {
    backgroundColor: theme.colors.background,
    borderRadius: 4,
  },
  playerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    paddingRight: theme.gap(2),
    paddingLeft: theme.gap(1),
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
  hoverView: {
    width: 280,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hoverContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(1),
    gap: theme.gap(1),
  },
  hoverPlayerName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  hoverHandicap: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
