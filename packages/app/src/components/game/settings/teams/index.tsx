import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCoState } from "jazz-tools/react-native";
import { useCallback, useMemo, useState } from "react";
import { Switch, View } from "react-native";
import { DraxProvider } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { GameHole, ListOfTeams, TeamsConfig } from "spicylib/schema";
import { useGame, useTeamsMode } from "@/hooks";
import { Text } from "@/ui";
import {
  ensureGameHoles,
  reassignAllPlayersSeamless,
  saveTeamAssignmentsToAllRelevantHoles,
} from "@/utils/gameTeams";
import { RotationChangeModal } from "./RotationChangeModal";
import { RotationFrequencyPicker } from "./RotationFrequencyPicker";
import { TeamAssignments } from "./TeamAssignments";
import type { PlayerRoundItem, RotationChangeOption } from "./types";

export function GameTeamsList() {
  // Load game with shallow holes - we only need hole IDs for writing
  // Deep team data is loaded separately for just the first hole
  const { game } = useGame(undefined, {
    resolve: {
      scope: { teamsConfig: true },
      spec: { $each: { $each: true } }, // Working copy of options (MapOfOptions -> Option fields)
      players: {
        $each: {
          name: true,
        },
      },
      rounds: {
        $each: {
          handicapIndex: true,
          round: {
            playerId: true,
          },
        },
      },
      holes: { $each: true }, // Shallow load - just hole objects, not deep team data
    },
  });

  // Get first hole ID for deep loading team assignments
  const firstHoleId =
    game?.$isLoaded && game.holes?.$isLoaded && game.holes[0]?.$isLoaded
      ? game.holes[0].$jazz.id
      : undefined;

  // Load only the first hole deeply for reading team assignments
  // This avoids loading 100+ objects (18 holes × teams × rounds)
  const firstHole = useCoState(GameHole, firstHoleId, {
    resolve: {
      teams: {
        $each: {
          rounds: {
            $each: {
              roundToGame: true,
            },
          },
        },
      },
    },
  });

  const { theme } = useUnistyles();

  // Get spec for useTeamsMode (working copy from game.spec)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Use game.$jazz.id to avoid recomputation on Jazz progressive loading
  const specs = useMemo(() => {
    if (!game?.$isLoaded || !game.spec?.$isLoaded) return [];
    return [game.spec];
  }, [game?.$jazz.id]);

  // Determine teams mode
  const { isSeamlessMode, isTeamsMode, canToggle } = useTeamsMode(game, specs);

  const [showRotationChangeModal, setShowRotationChangeModal] = useState(false);
  const [pendingRotationValue, setPendingRotationValue] = useState<
    number | null
  >(null);
  const [_rotationChangeOption, setRotationChangeOption] =
    useState<RotationChangeOption>("clearExceptFirst");

  const rotateEvery = useMemo(() => {
    if (
      !game?.$isLoaded ||
      !game.scope?.$isLoaded ||
      !game.scope.$jazz.has("teamsConfig")
    ) {
      return undefined;
    }
    const value = game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.rotateEvery
      : undefined;
    // Normalize null to undefined (can happen with legacy imported data)
    return value ?? undefined;
  }, [game]);

  const teamCount = useMemo(() => {
    // If no teamsConfig exists, calculate from number of players (individual games)
    const defaultTeamCount = game?.players?.$isLoaded ? game.players.length : 2;

    if (
      !game?.$isLoaded ||
      !game.scope?.$isLoaded ||
      !game.scope.$jazz.has("teamsConfig")
    ) {
      return defaultTeamCount;
    }
    const value = game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.teamCount
      : undefined;
    // Normalize null to defaultTeamCount (can happen with legacy imported data)
    return value ?? defaultTeamCount;
  }, [game]);

  const allPlayerRounds = useMemo(() => {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded) return [];

    const items: PlayerRoundItem[] = [];
    for (const roundToGame of game.rounds as Iterable<
      (typeof game.rounds)[number]
    >) {
      if (!roundToGame?.$isLoaded || !roundToGame.round?.$isLoaded) continue;

      const playerId = roundToGame.round.playerId;

      let player = null;
      if (game.players?.$isLoaded) {
        for (const p of game.players as Iterable<
          (typeof game.players)[number]
        >) {
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

  // Derive team assignments directly from Jazz data - no local state needed
  // Uses firstHole (deeply loaded) instead of game.holes[0] for efficiency
  const teamAssignments = useMemo((): Map<string, number> => {
    const assignments = new Map<string, number>();

    if (!firstHole?.$isLoaded || !firstHole.teams?.$isLoaded) {
      return assignments;
    }

    for (const team of firstHole.teams as Iterable<
      (typeof firstHole.teams)[number]
    >) {
      if (!team?.$isLoaded) continue;

      if (!team.rounds?.$isLoaded) continue;

      const teamNumber = Number.parseInt(team.team, 10);
      if (Number.isNaN(teamNumber)) continue;

      for (const roundToTeam of team.rounds as Iterable<
        (typeof team.rounds)[number]
      >) {
        if (!roundToTeam?.$isLoaded || !roundToTeam.roundToGame?.$isLoaded)
          continue;
        assignments.set(roundToTeam.roundToGame.$jazz.id, teamNumber);
      }
    }

    return assignments;
  }, [firstHole]);

  const saveTeamAssignmentsToGame = useCallback(
    (assignments: Map<string, number>) => {
      if (!game?.$isLoaded || !game.holes?.$isLoaded) {
        return;
      }

      ensureGameHoles(game);

      // Settings screen always saves to ALL holes (rotateEvery: 0)
      saveTeamAssignmentsToAllRelevantHoles(
        game,
        assignments,
        teamCount,
        0, // currentHoleIndex doesn't matter when rotateEvery is 0
        0, // rotateEvery: 0 means save to all holes
      );
    },
    [game, teamCount],
  );

  const handleTossBalls = useCallback(() => {
    const shuffled = [...allPlayerRounds].sort(() => Math.random() - 0.5);
    const newAssignments = new Map<string, number>();

    shuffled.forEach((player, index) => {
      const teamNumber = (index % teamCount) + 1;
      newAssignments.set(player.id, teamNumber);
    });

    saveTeamAssignmentsToGame(newAssignments);
  }, [allPlayerRounds, teamCount, saveTeamAssignmentsToGame]);

  const handleDrop = useCallback(
    (playerId: string, targetTeam: number) => {
      const newAssignments = new Map(teamAssignments);
      if (targetTeam === 0) {
        newAssignments.delete(playerId);
      } else {
        newAssignments.set(playerId, targetTeam);
      }
      saveTeamAssignmentsToGame(newAssignments);
    },
    [teamAssignments, saveTeamAssignmentsToGame],
  );

  const handleRotationChange = useCallback(
    async (value: number) => {
      if (!game?.$isLoaded || !game.scope?.$isLoaded) return;

      const currentRotateEvery = rotateEvery !== undefined ? rotateEvery : 0;
      const hasExistingTeams =
        game.holes?.$isLoaded &&
        game.holes.length > 0 &&
        game.holes.some(
          (h) => h?.$isLoaded && h.teams?.$isLoaded && h.teams.length > 0,
        );

      if (currentRotateEvery !== value && hasExistingTeams) {
        setPendingRotationValue(value);
        setShowRotationChangeModal(true);
        return;
      }

      if (!game.scope.$jazz.has("teamsConfig")) {
        const config = TeamsConfig.create(
          {
            rotateEvery: value,
            teamCount: teamCount,
          },
          { owner: game.$jazz.owner },
        );
        // NOTE: Must use ts-ignore (not ts-expect-error) due to unresolved Jazz schema strictness
        // This is a known issue and the ignore is intentional
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        // NOTE: Must use ts-ignore (not ts-expect-error) due to unresolved Jazz schema strictness
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.teamsConfig.$jazz.set("rotateEvery", value);
      }
    },
    [game, teamCount, rotateEvery],
  );

  const handleRotationChangeConfirm = useCallback(
    (option: RotationChangeOption) => {
      if (
        !game?.$isLoaded ||
        !game.scope?.$isLoaded ||
        pendingRotationValue === null
      )
        return;

      setRotationChangeOption(option);

      if (option === "clearExceptFirst" && game.holes?.$isLoaded) {
        for (let i = 1; i < game.holes.length; i++) {
          const hole = game.holes[i];
          if (hole?.$isLoaded) {
            const emptyTeams = ListOfTeams.create([], {
              owner: hole.$jazz.owner,
            });
            hole.$jazz.set("teams", emptyTeams);
          }
        }
      } else if (option === "clearAll" && game.holes?.$isLoaded) {
        for (const hole of game.holes as Iterable<
          (typeof game.holes)[number]
        >) {
          if (hole?.$isLoaded) {
            const emptyTeams = ListOfTeams.create([], {
              owner: hole.$jazz.owner,
            });
            hole.$jazz.set("teams", emptyTeams);
          }
        }
      }

      if (!game.scope.$jazz.has("teamsConfig")) {
        const config = TeamsConfig.create(
          {
            rotateEvery: pendingRotationValue,
            teamCount: teamCount,
          },
          { owner: game.$jazz.owner },
        );
        // NOTE: Must use ts-ignore (not ts-expect-error) due to unresolved Jazz schema strictness
        // This is a known issue and the ignore is intentional
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        // NOTE: Must use ts-ignore (not ts-expect-error) due to unresolved Jazz schema strictness
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.teamsConfig.$jazz.set("rotateEvery", pendingRotationValue);
      }

      setShowRotationChangeModal(false);
      setPendingRotationValue(null);
      setRotationChangeOption("clearExceptFirst");
    },
    [game, pendingRotationValue, teamCount],
  );

  /**
   * Handle toggling teams mode on/off.
   * When turning on: set teamsConfig.active = true
   * When turning off: set teamsConfig.active = false and reassign 1:1
   */
  const handleTeamsToggle = useCallback(
    (value: boolean) => {
      if (!game?.$isLoaded || !game.scope?.$isLoaded) return;

      // Ensure teamsConfig exists
      if (!game.scope.$jazz.has("teamsConfig")) {
        const playerCount = game.players?.$isLoaded ? game.players.length : 2;
        const config = TeamsConfig.create(
          {
            rotateEvery: 0,
            teamCount: playerCount,
            active: value,
          },
          { owner: game.$jazz.owner },
        );
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
        // @ts-ignore - Jazz $jazz.set types are overly strict
        game.scope.teamsConfig.$jazz.set("active", value);
      }

      // When turning off, reassign all players to individual teams (1:1)
      if (!value && game.rounds?.$isLoaded && game.holes?.$isLoaded) {
        reassignAllPlayersSeamless(game);
      }
    },
    [game],
  );

  // Render seamless mode message
  const renderSeamlessModeContent = () => (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIcon}>
        <FontAwesome6
          name="user"
          iconStyle="solid"
          size={48}
          color={theme.colors.secondary}
        />
      </View>
      <Text style={styles.emptyTitle}>Individual Play</Text>
      <Text style={styles.emptyText}>
        Players compete individually. Toggle teams on above to configure team
        play.
      </Text>
    </View>
  );

  // Render rotating teams message
  const renderRotatingTeamsContent = () => (
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
  );

  // Render teams content based on mode
  const renderTeamsContent = () => {
    // If rotateEvery > 0, show rotating teams message
    if (rotateEvery !== undefined && rotateEvery > 0) {
      return renderRotatingTeamsContent();
    }

    // Show team assignments UI
    return (
      <>
        <RotationFrequencyPicker
          rotateEvery={rotateEvery}
          onRotationChange={handleRotationChange}
        />
        <TeamAssignments
          allPlayerRounds={allPlayerRounds}
          teamCount={teamCount}
          teamAssignments={teamAssignments}
          onDrop={handleDrop}
          onTossBalls={handleTossBalls}
        />
      </>
    );
  };

  return (
    <DraxProvider>
      <View style={styles.container}>
        {/* Teams toggle - only shown when spec doesn't force teams */}
        {canToggle && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Teams</Text>
            <Switch
              value={isTeamsMode}
              onValueChange={handleTeamsToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.background}
            />
          </View>
        )}

        <RotationChangeModal
          visible={showRotationChangeModal}
          currentRotateEvery={rotateEvery}
          pendingRotateEvery={pendingRotationValue || 0}
          onConfirm={handleRotationChangeConfirm}
          onCancel={() => {
            setShowRotationChangeModal(false);
            setPendingRotationValue(null);
          }}
        />

        {/* Main content based on mode */}
        {isSeamlessMode ? renderSeamlessModeContent() : renderTeamsContent()}
      </View>
    </DraxProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
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
}));
