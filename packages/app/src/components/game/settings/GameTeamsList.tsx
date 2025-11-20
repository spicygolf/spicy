import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { DraxProvider, DraxScrollView, DraxView } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { RoundToGame } from "spicylib/schema";
import {
  ListOfRoundToTeams,
  ListOfTeams,
  RoundToTeam,
  Team,
} from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { Button, Text } from "@/ui";

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

export function GameTeamsList() {
  const { game } = useGameContext();
  const { theme } = useUnistyles();

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

    console.log(
      "getCurrentTeamAssignments - game.holes loaded?",
      game?.holes?.$isLoaded,
    );

    if (!game?.holes?.$isLoaded) {
      console.log("No holes loaded, returning empty assignments");
      return assignments;
    }

    const firstHole = game.holes[0];
    if (!firstHole?.$isLoaded) {
      console.log("First hole not loaded");
      return assignments;
    }

    console.log("First hole:", firstHole.hole);
    console.log("First hole teams loaded?", firstHole.teams?.$isLoaded);

    if (!firstHole.teams?.$isLoaded) {
      console.log("First hole teams not loaded, returning empty assignments");
      return assignments;
    }

    console.log("First hole teams count:", firstHole.teams.length);

    for (const team of firstHole.teams) {
      if (!team?.$isLoaded) continue;

      console.log(
        "Team:",
        team.team,
        "loaded?",
        team.$isLoaded,
        "rounds loaded?",
        team.rounds?.$isLoaded,
      );

      if (!team.rounds?.$isLoaded) continue;

      const teamNumber = Number.parseInt(team.team, 10);
      if (Number.isNaN(teamNumber)) continue;

      console.log(`Team ${teamNumber} has ${team.rounds.length} rounds`);

      for (const roundToTeam of team.rounds) {
        if (!roundToTeam?.$isLoaded || !roundToTeam.roundToGame?.$isLoaded)
          continue;
        assignments.set(roundToTeam.roundToGame.$jazz.id, teamNumber);
        console.log(
          `Assigned roundToGame ${roundToTeam.roundToGame.$jazz.id} to team ${teamNumber}`,
        );
      }
    }

    console.log("Total assignments loaded:", assignments.size);
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
    (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded) {
        console.log("Game holes not loaded");
        return;
      }

      console.log("Saving team assignments:", assignments);
      console.log("Current holes count:", game.holes.length);

      // If no holes exist, create them based on game scope
      if (game.holes.length === 0) {
        console.log("No holes exist, creating them...");
        const { GameHole } = require("spicylib/schema");

        const scopeHoles = game.scope?.$isLoaded ? game.scope.holes : "all18";
        let holeNumbers: number[] = [];

        if (scopeHoles === "front9") {
          holeNumbers = Array.from({ length: 9 }, (_, i) => i + 1);
        } else if (scopeHoles === "back9") {
          holeNumbers = Array.from({ length: 9 }, (_, i) => i + 10);
        } else {
          holeNumbers = Array.from({ length: 18 }, (_, i) => i + 1);
        }

        for (const holeNum of holeNumbers) {
          const gameHole = GameHole.create(
            {
              hole: holeNum.toString(),
              seq: holeNum,
              teams: ListOfTeams.create([], { owner: game.$jazz.owner }),
            },
            { owner: game.$jazz.owner },
          );
          game.holes.$jazz.push(gameHole);
        }

        console.log(`Created ${holeNumbers.length} holes`);
      }

      for (const hole of game.holes) {
        if (!hole?.$isLoaded) {
          console.log("Hole not loaded, skipping");
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

        console.log(`Setting teams for hole ${hole.hole}:`, newTeams.length);
        hole.$jazz.set("teams", newTeams);
      }

      console.log("Team assignments saved to all holes");
    },
    [game, allPlayerRounds, teamCount],
  );

  const handleTossBalls = useCallback(() => {
    const shuffled = [...allPlayerRounds].sort(() => Math.random() - 0.5);
    const newAssignments = new Map<string, number>();

    shuffled.forEach((player, index) => {
      const teamNumber = (index % teamCount) + 1;
      newAssignments.set(player.id, teamNumber);
    });

    setTeamAssignments(newAssignments);
    saveTeamAssignmentsToGame(newAssignments);
  }, [allPlayerRounds, teamCount, saveTeamAssignmentsToGame]);

  const handleDrop = useCallback(
    (playerId: string, targetTeam: number) => {
      console.log(`handleDrop: player ${playerId} to team ${targetTeam}`);
      const newAssignments = new Map(teamAssignments);
      if (targetTeam === 0) {
        newAssignments.delete(playerId);
      } else {
        newAssignments.set(playerId, targetTeam);
      }
      console.log("New assignments:", newAssignments);
      setTeamAssignments(newAssignments);
      saveTeamAssignmentsToGame(newAssignments);
    },
    [teamAssignments, saveTeamAssignmentsToGame],
  );

  if (!hasTeamsConfig || rotateEvery !== 0) {
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
        <Text style={styles.emptyTitle}>Teams Not Configured</Text>
        <Text style={styles.emptyText}>
          This game doesn't use fixed teams, or teams rotate during play.
        </Text>
      </View>
    );
  }

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
    <DraxProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Assignments</Text>
          <Button label="Toss Balls" onPress={handleTossBalls} />
        </View>

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
