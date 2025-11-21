import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { DraxProvider } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  ListOfRoundToTeams,
  ListOfTeams,
  RoundToTeam,
  Team,
  TeamsConfig,
} from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { Text } from "@/ui";
import { ensureGameHoles } from "@/utils/gameTeams";
import { RotationChangeModal } from "./RotationChangeModal";
import { RotationFrequencyPicker } from "./RotationFrequencyPicker";
import { TeamAssignments } from "./TeamAssignments";
import type { PlayerRoundItem, RotationChangeOption } from "./types";

export function GameTeamsList() {
  const { game } = useGameContext();
  const { theme } = useUnistyles();

  const [showRotationChangeModal, setShowRotationChangeModal] = useState(false);
  const [pendingRotationValue, setPendingRotationValue] = useState<
    number | null
  >(null);
  const [_rotationChangeOption, setRotationChangeOption] =
    useState<RotationChangeOption>("clearExceptFirst");

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

  // Derive team assignments directly from Jazz data - no local state needed
  const teamAssignments = useMemo((): Map<string, number> => {
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
  }, [game?.holes]);

  const saveTeamAssignmentsToGame = useCallback(
    async (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded) {
        return;
      }

      ensureGameHoles(game);

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
      await saveTeamAssignmentsToGame(newAssignments);
    },
    [teamAssignments, saveTeamAssignmentsToGame],
  );

  const handleRotationChange = useCallback(
    async (value: number) => {
      if (!game?.scope?.$isLoaded) return;

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
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        game.scope.teamsConfig.$jazz.set("rotateEvery", value);
      }
    },
    [game, teamCount, rotateEvery],
  );

  const handleRotationChangeConfirm = useCallback(
    (option: RotationChangeOption) => {
      if (!game?.scope?.$isLoaded || pendingRotationValue === null) return;

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
        for (const hole of game.holes) {
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
        game.scope.$jazz.set("teamsConfig", config);
      } else if (game.scope.teamsConfig?.$isLoaded) {
        game.scope.teamsConfig.$jazz.set("rotateEvery", pendingRotationValue);
      }

      setShowRotationChangeModal(false);
      setPendingRotationValue(null);
      setRotationChangeOption("clearExceptFirst");
    },
    [game, pendingRotationValue, teamCount],
  );

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

  const styles = useStyles;

  return (
    <DraxProvider>
      <View style={styles.container}>
        <RotationFrequencyPicker
          rotateEvery={rotateEvery}
          onRotationChange={handleRotationChange}
        />

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

        {rotateEvery === 0 ? (
          <TeamAssignments
            allPlayerRounds={allPlayerRounds}
            teamCount={teamCount}
            teamAssignments={teamAssignments}
            onDrop={handleDrop}
            onTossBalls={handleTossBalls}
          />
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

const useStyles = StyleSheet.create((theme) => ({
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
}));
