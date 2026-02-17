import type { ID } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useEffect, useState } from "react";
import type { Game, Player, Round } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import { getRoundsForDate } from "@/utils/createRoundForPlayer";

interface RoundsForDateResult {
  rounds: Round[];
  loaded: boolean;
}

/**
 * Reactively loads rounds for a player on a given date by scanning the user's
 * games. Uses a two-phase approach: shallow-loads all games via useAccount,
 * then async deep-loads only same-date games (lazy loading for performance).
 *
 * @param playerId - The player's CoValue ID to match
 * @param gameDate - The date to find rounds for
 * @param excludeGameId - Game ID to exclude from search (the current game)
 */
export function useRoundsForDate(
  playerId: ID<Player>,
  gameDate: Date,
  excludeGameId: ID<Game> | undefined,
): RoundsForDateResult {
  const me = useAccount(PlayerAccount, {
    resolve: { root: { games: { $each: true } } },
  });
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loaded, setLoaded] = useState(false);

  const allGames = me?.$isLoaded ? me.root?.games : undefined;
  const gameDateMs = gameDate.getTime();

  useEffect(() => {
    if (!excludeGameId || !allGames?.$isLoaded) return;

    let cancelled = false;
    setLoaded(false);

    getRoundsForDate(
      playerId,
      new Date(gameDateMs),
      allGames,
      excludeGameId,
    ).then((result) => {
      if (!cancelled) {
        setRounds(result);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [playerId, gameDateMs, allGames, excludeGameId]);

  return { rounds, loaded };
}
