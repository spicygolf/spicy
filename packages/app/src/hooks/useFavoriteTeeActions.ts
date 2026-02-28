import type { MaybeLoaded } from "jazz-tools";
import { useCallback } from "react";
import type { CourseTee, Game, Player, Round } from "spicylib/schema";
import { propagateCourseTeeToPlayers } from "spicylib/utils";

interface UseFavoriteTeeActionsOptions {
  round: MaybeLoaded<Round> | null;
  game: MaybeLoaded<Game> | null;
  player: MaybeLoaded<Player> | null;
  // biome-ignore lint/suspicious/noExplicitAny: PlayerAccount is a co.account() value, not a standalone type
  me: MaybeLoaded<any> | null;
  goBack: () => void;
}

/**
 * Shared callbacks for selecting and removing favorite tees.
 * Used by both SelectCourseRecents and SelectCourseFavorites tabs.
 */
export function useFavoriteTeeActions({
  round,
  game,
  player,
  me,
  goBack,
}: UseFavoriteTeeActionsOptions) {
  const handleSelectTee = useCallback(
    async (favorite: MaybeLoaded<CourseTee>) => {
      if (!round?.$isLoaded || !favorite?.$isLoaded) {
        return;
      }

      const loadedFavorite = await favorite.$jazz.ensureLoaded({
        resolve: {
          course: true,
          tee: true,
        },
      });

      if (!loadedFavorite.course?.$isLoaded || !loadedFavorite.tee?.$isLoaded) {
        return;
      }

      loadedFavorite.$jazz.set("lastUsedAt", new Date());

      round.$jazz.set("course", loadedFavorite.course);
      round.$jazz.set("tee", loadedFavorite.tee);

      if (game?.$isLoaded && player?.$isLoaded) {
        propagateCourseTeeToPlayers(
          game,
          loadedFavorite.course,
          loadedFavorite.tee,
          player.$jazz.id,
        );
      }

      goBack();
    },
    [round, game, player, goBack],
  );

  const removeFavorite = useCallback(
    async (favorite: MaybeLoaded<CourseTee>) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.courseTees?.$isLoaded ||
        !favorite?.$isLoaded
      ) {
        return;
      }

      const courseTees = me.root.favorites.courseTees;
      const index = courseTees.findIndex(
        (f: MaybeLoaded<CourseTee>) => f?.$jazz.id === favorite.$jazz.id,
      );
      if (index >= 0) {
        courseTees.$jazz.splice(index, 1);
      }
    },
    [me],
  );

  return { handleSelectTee, removeFavorite };
}
