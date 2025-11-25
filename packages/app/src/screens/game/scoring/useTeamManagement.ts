import { useCallback, useState } from "react";
import type { Game } from "spicylib/schema";
import {
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

  // Calculate if we should show the chooser based on current data state
  // Jazz reactivity will trigger re-render when data changes
  // Only show if data is fully loaded to avoid flickering
  const showChooser =
    game?.holes?.$isLoaded && game.holes.length > 0 && rotateEvery !== undefined
      ? shouldShowTeamChooser(game.holes, currentHoleIndex, rotateEvery, game)
      : false;

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
    // showChooser will update automatically via Jazz reactivity
  }, [game, rotateEvery, changeTeamsScope, currentHoleIndex, holesList.length]);

  const handleTeamAssignmentsChange = useCallback(
    (assignments: Map<string, number>) => {
      if (!game?.holes?.$isLoaded || rotateEvery === undefined) return;

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

      // showChooser will update automatically via Jazz reactivity when teams are assigned
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
