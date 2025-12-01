/**
 * Returns course and tee information in the format "SLUG • TeeName".
 * Returns "various" if players have different courses/tees or incomplete selections.
 * Returns null if still loading.
 *
 * PERFORMANCE: Only loads course and tee names from rounds, not full round data.
 *
 * @param roundsId - ListOfRoundToGames ID to check
 * @returns Course/tee string if same across all rounds, "various" if different, null if loading
 *
 * @example
 * const courseName = useGameCourseName(game?.rounds?.$jazz.id);
 * // Returns: "DHGC • Presidents" or "various" or null
 */
export function useGameCourseName(roundsId: string | undefined): string | null {
  // TODO: Re-implement without deep subscription to avoid errors during tee selection
  // Temporarily disabled to debug subscription issues
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = roundsId;
  return null;
}
