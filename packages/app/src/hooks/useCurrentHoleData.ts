import type { Game } from "spicylib/schema";

/**
 * Accesses current hole data to trigger Jazz lazy loading
 * Just touching the data is enough - Jazz will load it automatically
 * No explicit ensureLoaded calls to avoid infinite loops
 */
export function useCurrentHoleData(
  game: Game | null,
  currentHoleIndex: number,
) {
  if (!game?.$isLoaded || !game.holes?.$isLoaded) {
    return;
  }

  const hole = game.holes[currentHoleIndex];
  if (!hole?.$isLoaded) return;

  // Just access the data - Jazz will load it automatically
  // No useEffect, no ensureLoaded, just triggering the getters
  const teams = hole.teams;
  if (!teams?.$isLoaded) return;

  for (const team of teams) {
    if (!team?.$isLoaded || !team.rounds?.$isLoaded) continue;

    for (const roundToTeam of team.rounds) {
      if (!roundToTeam?.$isLoaded) continue;

      const rtg = roundToTeam.roundToGame;
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

      const round = rtg.round;
      if (!round.scores?.$isLoaded) continue;

      // Access the score to trigger loading
      const score = round.scores[currentHoleIndex];
      if (score?.$isLoaded) {
        // Touch values to ensure they load
        void score.values;
      }
    }
  }
}
