import type { Course, Game, Tee } from "spicylib/schema";

/**
 * Finds an existing course/tee selection from other players in the game.
 * Returns the first round that has both course and tee set.
 */
export function findExistingCourseTeeInGame(
  game: Game,
): { course: Course; tee: Tee } | null {
  if (!game.$isLoaded || !game.rounds?.$isLoaded) {
    return null;
  }

  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
    const round = rtg.round;

    if (
      round.$jazz.has("course") &&
      round.$jazz.has("tee") &&
      round.course?.$isLoaded &&
      round.tee?.$isLoaded
    ) {
      return { course: round.course, tee: round.tee };
    }
  }

  return null;
}

/**
 * Checks if a tee is compatible with a player's gender.
 * - Mixed tees are compatible with all players
 * - Gendered tees must match the player's gender
 */
export function isTeeCompatibleWithGender(
  teeGender: "M" | "F" | "Mixed",
  playerGender: "M" | "F",
): boolean {
  return teeGender === "Mixed" || teeGender === playerGender;
}

/**
 * Propagates course/tee selection to other players in the game who don't have one set.
 * Respects gender matching: only applies tee if compatible with player's gender.
 *
 * @param game - The game with rounds and players loaded
 * @param course - The course to propagate
 * @param tee - The tee to propagate
 * @param excludePlayerId - Optional player ID to exclude (the one who just selected)
 */
export function propagateCourseTeeToPlayers(
  game: Game,
  course: Course,
  tee: Tee,
  excludePlayerId?: string,
): void {
  if (!game.$isLoaded || !game.rounds?.$isLoaded || !game.players?.$isLoaded) {
    return;
  }

  if (!course.$isLoaded || !tee.$isLoaded) {
    return;
  }

  const teeGender = tee.gender;

  for (const rtg of game.rounds) {
    if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
    const round = rtg.round;

    // Skip if this round already has course/tee
    if (round.$jazz.has("course") && round.$jazz.has("tee")) {
      continue;
    }

    // Skip the player who just selected (if provided)
    if (excludePlayerId && round.playerId === excludePlayerId) {
      continue;
    }

    // Find the player for this round to check gender
    let player = null;
    for (const p of game.players) {
      if (p?.$isLoaded && p.$jazz.id === round.playerId) {
        player = p;
        break;
      }
    }

    if (!player?.$isLoaded) continue;

    // Check gender compatibility
    if (!isTeeCompatibleWithGender(teeGender, player.gender)) {
      continue;
    }

    // Apply course and tee to this round
    round.$jazz.set("course", course);
    round.$jazz.set("tee", tee);
  }
}

/**
 * Applies an existing course/tee from the game to a newly added player's round.
 * Called after creating a round for a new player.
 *
 * @param game - The game with rounds and players loaded
 * @param playerId - The Jazz ID of the player whose round should receive the course/tee
 * @returns true if course/tee was applied, false otherwise
 */
export function applyExistingCourseTeeToRound(
  game: Game,
  playerId: string,
): boolean {
  if (!game.$isLoaded || !game.players?.$isLoaded || !game.rounds?.$isLoaded) {
    return false;
  }

  const existing = findExistingCourseTeeInGame(game);
  if (!existing) {
    return false;
  }

  const { course, tee } = existing;

  // Find the player to check gender
  let player = null;
  for (const p of game.players) {
    if (p?.$isLoaded && p.$jazz.id === playerId) {
      player = p;
      break;
    }
  }

  if (!player?.$isLoaded) {
    return false;
  }

  // Check gender compatibility
  if (!isTeeCompatibleWithGender(tee.gender, player.gender)) {
    return false;
  }

  // Find the round for this player
  let rtg = null;
  for (const r of game.rounds) {
    if (r?.$isLoaded && r.round?.$isLoaded && r.round.playerId === playerId) {
      rtg = r;
      break;
    }
  }

  if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) {
    return false;
  }

  // Apply course and tee
  rtg.round.$jazz.set("course", course);
  rtg.round.$jazz.set("tee", tee);

  return true;
}
