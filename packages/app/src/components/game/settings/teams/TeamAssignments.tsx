import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useMemo } from "react";
import { View } from "react-native";
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
}

export function TeamAssignments({
  allPlayerRounds,
  teamCount,
  teamAssignments,
  onDrop,
  onTossBalls,
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
    if (unassignedPlayers.length > 0) {
      sections.push({
        teamNumber: 0,
        teamName: "Unassigned",
        players: unassignedPlayers,
      });
    }

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
        <Button label="Toss Balls" onPress={onTossBalls} />
      </View>

      <DraxScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        {teamSections.map((section) => (
          <DraxView
            key={section.teamNumber}
            style={styles.teamSection}
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
                  <Text style={styles.emptyTeamText}>Drag players here</Text>
                </View>
              )}
            </View>
          </DraxView>
        ))}
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
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: theme.gap(20),
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
