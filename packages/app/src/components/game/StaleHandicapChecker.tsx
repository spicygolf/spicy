import type { Golfer } from "@spicygolf/ghin";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame, useStaleHandicapCheck } from "@/hooks";
import { apiPost } from "@/lib/api-client";
import { StaleHandicapModal } from "./StaleHandicapModal";

interface StaleHandicapCheckerProps {
  gameId: string;
}

/**
 * Self-contained component that checks for stale GHIN handicaps on mount
 * and shows a modal prompting the user to refresh.
 *
 * Isolated from the parent GameNavigator so that Jazz re-renders from the
 * players subscription don't cause render loops in the parent.
 */
export function StaleHandicapChecker({ gameId }: StaleHandicapCheckerProps) {
  const { game } = useGame(gameId, {
    resolve: {
      players: {
        $each: {
          name: true,
          ghinId: true,
          handicap: true,
        },
      },
    },
  });

  const { stalePlayers, dismissAll } = useStaleHandicapCheck(
    game?.$isLoaded ? game.players : undefined,
  );

  const [showModal, setShowModal] = useState(false);
  const shownRef = useRef(false);

  // Show the modal once when stale players are first detected.
  useEffect(() => {
    if (stalePlayers.length > 0 && !shownRef.current) {
      shownRef.current = true;
      setShowModal(true);
    }
  }, [stalePlayers]);

  const handleRefresh = useCallback(
    async (ghinIds: string[]) => {
      setShowModal(false);
      if (!game?.$isLoaded || !game.players?.$isLoaded) return;

      for (const ghinId of ghinIds) {
        try {
          const golfer = await apiPost<Golfer>("/ghin/players/get", {
            ghinNumber: Number(ghinId),
          });
          if (!golfer) continue;

          // Find the matching player and update their handicap
          for (const player of game.players) {
            if (!player?.$isLoaded || player.ghinId !== ghinId) continue;
            if (!player.handicap?.$isLoaded) continue;

            player.handicap.$jazz.set("display", golfer.hi_display);
            if (typeof golfer.hi_value === "number") {
              player.handicap.$jazz.set("value", golfer.hi_value);
            }
            if (golfer.rev_date instanceof Date) {
              player.handicap.$jazz.set("revDate", golfer.rev_date);
            } else if (golfer.rev_date) {
              player.handicap.$jazz.set("revDate", new Date(golfer.rev_date));
            }
            break;
          }
        } catch (error) {
          console.error(
            `Failed to refresh handicap for GHIN ${ghinId}:`,
            error,
          );
        }
      }
    },
    [game],
  );

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    dismissAll();
  }, [dismissAll]);

  return (
    <StaleHandicapModal
      visible={showModal}
      stalePlayers={stalePlayers}
      onRefresh={handleRefresh}
      onDismiss={handleDismiss}
    />
  );
}
