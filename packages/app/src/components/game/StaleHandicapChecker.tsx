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
      handicapCheckDismissedAt: true,
      players: {
        $each: {
          name: true,
          ghinId: true,
          handicap: true,
        },
      },
    },
  });

  const dismissedAt = game?.$isLoaded
    ? game.handicapCheckDismissedAt
      ? new Date(game.handicapCheckDismissedAt)
      : undefined
    : undefined;

  const stalePlayers = useStaleHandicapCheck(
    game?.$isLoaded ? game.players : undefined,
    dismissedAt,
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
      const players = game.players;

      await Promise.allSettled(
        ghinIds.map(async (ghinId) => {
          try {
            const golfer = await apiPost<Golfer>("/ghin/players/get", {
              ghinNumber: Number(ghinId),
            });
            if (!golfer) return;

            // Find the matching player and update their handicap
            for (const player of players) {
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
        }),
      );

      // Persist dismiss regardless of refresh success/failure so the modal
      // doesn't keep reappearing. If fresh data arrived, the hook will
      // detect revDate > dismissedAt and re-show the modal next time.
      game.$jazz.set("handicapCheckDismissedAt", new Date());
    },
    [game],
  );

  const handleDismiss = useCallback(() => {
    setShowModal(false);
    if (game?.$isLoaded) {
      game.$jazz.set("handicapCheckDismissedAt", new Date());
    }
  }, [game]);

  return (
    <StaleHandicapModal
      visible={showModal}
      stalePlayers={stalePlayers}
      onRefresh={handleRefresh}
      onDismiss={handleDismiss}
    />
  );
}
