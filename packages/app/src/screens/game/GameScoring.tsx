import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { TeamChooser } from "@/components/game/TeamChooser";
import { useGameContext } from "@/contexts/GameContext";
import { Button, Screen, Text } from "@/ui";
import {
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
  const [isLoadingHole, setIsLoadingHole] = useState(false);

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
        setIsLoadingHole(true);
        await game.$jazz.ensureLoaded({
          resolve: { holes: { $each: true } },
        });
      }

      if (!game.holes?.$isLoaded) {
        setIsLoadingHole(false);
        return;
      }

      const hole = game.holes[currentHoleIndex];

      // If hole doesn't exist or teams aren't loaded, load them
      if (hole?.$isLoaded && !hole.teams?.$isLoaded) {
        setIsLoadingHole(true);
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

      setIsLoadingHole(false);

      if (!game.holes?.$isLoaded) return;

      // Try to ensure hole has teams (will copy from hole 1 if rotateEvery=0)
      ensureHoleHasTeams(game, game.holes, currentHoleIndex, rotateEvery);

      // Determine if we need to show the chooser
      const needsChooser = shouldShowTeamChooser(
        game.holes,
        currentHoleIndex,
        rotateEvery,
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

  const handleTeamAssignmentsChange = useCallback(
    (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded) return;

      // Save to current hole
      saveTeamAssignmentsToHole(
        game,
        game.holes,
        currentHoleIndex,
        assignments,
        teamCount,
      );

      // If this is hole 1 and rotateEvery > 0, we may need to apply to multiple holes
      if (currentHoleIndex === 0 && rotateEvery && rotateEvery > 0) {
        // For rotating teams, save to holes until next rotation point
        for (let i = 1; i < rotateEvery && i < holesList.length; i++) {
          saveTeamAssignmentsToHole(
            game,
            game.holes,
            i,
            assignments,
            teamCount,
          );
        }
      }

      // Hide the chooser after teams are set
      setShowChooser(false);
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
              <Text style={styles.debugTitle}>
                Scoring UI for Hole {currentHoleNumber}
              </Text>
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
  debugTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.gap(2),
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
}));
