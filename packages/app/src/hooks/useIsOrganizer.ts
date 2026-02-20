import { useAccount } from "jazz-tools/react-native";
import type { Game } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";

/**
 * Check if the current user is the organizer of a game.
 *
 * Returns:
 * - `undefined` while game or account is still loading
 * - `true` if the user is the organizer or the game has no organizer (legacy)
 * - `false` if the user is not the organizer
 *
 * @param game - The game to check organizer status for
 */
export function useIsOrganizer(
  game: Game | null | undefined,
): boolean | undefined {
  const me = useAccount(PlayerAccount);

  if (!game?.$isLoaded || !me?.$isLoaded) return undefined;

  // Legacy games without organizer: everyone is an organizer
  if (!game.organizer) return true;

  return game.organizer === me.$jazz.id;
}
