import { useCallback, useEffect, useState } from "react";
import type { Game } from "spicylib/schema";
import {
  ensureGameHoles,
  ensureHoleHasTeams,
  saveTeamAssignmentsToHole,
  shouldShowTeamChooser,
} from "@/utils/gameTeams";

export interface UseTeamManagementReturn {
  showChooser: boolean;
  showChangeTeamsModal: boolean;
  changeTeamsScope: "current" | "period";
  teamCount: number;
  rotateEvery: number | undefined;
  setShowChangeTeamsModal: (show: boolean) => void;
  setChangeTeamsScope: (scope: "current" | "period") => void;
  handleChangeTeamsConfirm: () => void;
  handleTeamAssignmentsChange: (assignments: Map<string, number>) => void;
}

export function useTeamManagement(
  game: Game | null,
  currentHoleIndex: number,
  holesList: string[],
): UseTeamManagementReturn {
  const [showChooser, setShowChooser] = useState(false);
  const [showChangeTeamsModal, setShowChangeTeamsModal] = useState(false);
  const [changeTeamsScope, setChangeTeamsScope] = useState<
    "current" | "period"
  >("period");

  // Direct access to Jazz data - no useMemo needed per jazz.xml patterns
  let rotateEvery: number | undefined;
  if (game?.scope?.$isLoaded && game.scope.$jazz.has("teamsConfig")) {
    rotateEvery = game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.rotateEvery
      : undefined;
  }

  let teamCount = 2;
  if (game?.scope?.$isLoaded && game.scope.$jazz.has("teamsConfig")) {
    teamCount = game.scope.teamsConfig?.$isLoaded
      ? game.scope.teamsConfig.teamCount
      : 2;
  }

  // Load current hole's teams and check if we need to show the team chooser
  // biome-ignore lint/correctness/useExhaustiveDependencies: game causes infinite loop due to Jazz reactivity
  useEffect(() => {
    async function loadCurrentHole() {
      if (!game?.$isLoaded || rotateEvery === undefined) return;

      if (!game.holes?.$isLoaded) {
        await game.$jazz.ensureLoaded({
          resolve: { holes: { $each: true } },
        });
      }

      if (!game.holes?.$isLoaded) return;

      // Ensure we have holes for the game
      ensureGameHoles(game);

      const hole = game.holes[currentHoleIndex];

      // Early exit if this hole's teams are already loaded and populated
      if (hole?.$isLoaded && hole.teams?.$isLoaded && hole.teams.length > 0) {
        const firstTeam = hole.teams[0];
        if (firstTeam?.$isLoaded && firstTeam.rounds?.$isLoaded) {
          // Data already loaded, just check if we need the chooser
          const needsChooser = shouldShowTeamChooser(
            game.holes,
            currentHoleIndex,
            rotateEvery,
            game,
          );
          setShowChooser((prev) =>
            prev !== needsChooser ? needsChooser : prev,
          );
          return;
        }
      }

      if (hole?.$isLoaded && !hole.teams?.$isLoaded) {
        // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
        await hole.teams.$jazz.ensureLoaded({});
      }

      if (hole?.$isLoaded && hole.teams?.$isLoaded) {
        for (const team of hole.teams) {
          if (!team?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            await team.$jazz.ensureLoaded({});
          }

          if (team?.$isLoaded && !team.rounds?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            await team.rounds.$jazz.ensureLoaded({});
          }

          // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
          if (team?.rounds?.$isLoaded) {
            // @ts-expect-error - TypeScript doesn't narrow MaybeLoaded properly
            for (const roundToTeam of team.rounds) {
              if (!roundToTeam?.$isLoaded) {
                await roundToTeam.$jazz.ensureLoaded({
                  resolve: { roundToGame: true },
                });
              } else if (
                roundToTeam?.$isLoaded &&
                !roundToTeam.roundToGame?.$isLoaded
              ) {
                await roundToTeam.$jazz.ensureLoaded({
                  resolve: { roundToGame: true },
                });
              }

              // Load round and scores
              if (!roundToTeam?.$isLoaded) continue;
              const rtg = roundToTeam.roundToGame;
              if (rtg?.$isLoaded && rtg.round?.$isLoaded) {
                const round = rtg.round;
                if (!round.scores?.$isLoaded) {
                  await round.scores.$jazz.ensureLoaded({});
                }

                // Load each score's values
                if (round.scores?.$isLoaded) {
                  for (const score of round.scores) {
                    if (score?.$isLoaded && !score.values?.$isLoaded) {
                      await score.values.$jazz.ensureLoaded({});
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!game.holes?.$isLoaded) return;

      ensureHoleHasTeams(game, game.holes, currentHoleIndex, rotateEvery);

      const needsChooser = shouldShowTeamChooser(
        game.holes,
        currentHoleIndex,
        rotateEvery,
        game,
      );

      // Only update if value changed to prevent infinite re-renders
      setShowChooser((prev) => {
        if (prev !== needsChooser) {
          return needsChooser;
        }
        return prev;
      });
    }

    loadCurrentHole();
    // Only depend on stable values, not the reactive game object itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHoleIndex, rotateEvery]);

  const handleChangeTeamsConfirm = useCallback(() => {
    if (!game?.holes?.$isLoaded || rotateEvery === undefined) return;

    const holesToClear: number[] = [];

    if (changeTeamsScope === "current") {
      holesToClear.push(currentHoleIndex);
    } else {
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
        holesToClear.push(currentHoleIndex);
      }
    }

    for (const holeIndex of holesToClear) {
      const hole = game.holes[holeIndex];
      if (hole?.$isLoaded) {
        const { ListOfTeams } = require("spicylib/schema");
        const emptyTeams = ListOfTeams.create([], { owner: hole.$jazz.owner });
        hole.$jazz.set("teams", emptyTeams);
      }
    }

    setShowChangeTeamsModal(false);
    setShowChooser(true);
  }, [game, rotateEvery, changeTeamsScope, currentHoleIndex, holesList.length]);

  const handleTeamAssignmentsChange = useCallback(
    (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded || rotateEvery === undefined) return;

      const totalPlayers = game.rounds?.$isLoaded ? game.rounds.length : 0;
      const assignedPlayers = assignments.size;
      const allPlayersAssigned = assignedPlayers === totalPlayers;

      if (rotateEvery > 0) {
        const rotationPeriodStart =
          Math.floor(currentHoleIndex / rotateEvery) * rotateEvery;
        const rotationPeriodEnd = Math.min(
          rotationPeriodStart + rotateEvery,
          holesList.length,
        );

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
        saveTeamAssignmentsToHole(
          game,
          game.holes,
          currentHoleIndex,
          assignments,
          teamCount,
        );
      }

      if (allPlayersAssigned) {
        setShowChooser(false);
      }
    },
    [game, currentHoleIndex, teamCount, rotateEvery, holesList.length],
  );

  return {
    showChooser,
    showChangeTeamsModal,
    changeTeamsScope,
    teamCount,
    rotateEvery,
    setShowChangeTeamsModal,
    setChangeTeamsScope,
    handleChangeTeamsConfirm,
    handleTeamAssignmentsChange,
  };
}
