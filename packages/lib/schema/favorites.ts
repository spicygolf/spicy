import { co, z } from "jazz-tools";
import { Course, Tee } from "./courses";
import { GameSpec } from "./gamespecs";
import { Player } from "./players";

// Composite key for course/tee combination - similar to RoundToGame pattern
export const CourseTee = co.map({
  course: Course,
  tee: Tee,
  addedAt: z.date(),
});

export type CourseTee = co.loaded<typeof CourseTee>;

export const ListOfCourseTees = co.list(CourseTee);

// Future: Favorite player - stores reference to actual player
export const FavoritePlayer = co.map({
  player: Player,
  addedAt: z.date(),
});

export type FavoritePlayer = co.loaded<typeof FavoritePlayer>;

export const ListOfFavoritePlayers = co.list(FavoritePlayer);

// Future: Favorite game spec
export const FavoriteSpec = co.map({
  spec: GameSpec,
  addedAt: z.date(),
});

export type FavoriteSpec = co.loaded<typeof FavoriteSpec>;

export const ListOfFavoriteSpecs = co.list(FavoriteSpec);

// Favorites container that can be extended
export const Favorites = co.map({
  courseTees: co.optional(ListOfCourseTees),
  players: co.optional(ListOfFavoritePlayers),
  specs: co.optional(ListOfFavoriteSpecs),
});

/**
 * Pre-defined resolved types for common loading patterns.
 * Use these with .load() or ensureLoaded to get type-safe deeply loaded objects.
 */
export const CourseTeeWithRefs = CourseTee.resolved({
  course: true,
  tee: true,
});
export type CourseTeeWithRefs = co.loaded<typeof CourseTeeWithRefs>;

export const FavoritePlayerWithRef = FavoritePlayer.resolved({
  player: true,
});
export type FavoritePlayerWithRef = co.loaded<typeof FavoritePlayerWithRef>;
