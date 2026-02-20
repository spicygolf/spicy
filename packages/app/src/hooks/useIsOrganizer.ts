import { useAccount } from "jazz-tools/react-native";
import type { Game } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";

/**
 * Check if the current user is the organizer of a game.
 *
 * Returns true if:
 * - The user's account ID matches game.organizer
 * - The game has no organizer set (legacy games — everyone can edit)
 *
 * @param game - The game to check organizer status for
 * @returns Whether the current user is the game organizer
 */
export function useIsOrganizer(game: Game | null | undefined): boolean {
  const me = useAccount(PlayerAccount);

  if (!game?.$isLoaded || !me?.$isLoaded) return false;

  // Legacy games without organizer: everyone is an organizer
  if (!game.organizer) return true;

  return game.organizer === me.$jazz.id;
}
