import { useCoState } from "jazz-tools/react";
import { Game } from "@/schema/games";

export function useGame(gameId: string) {
  const game = useCoState(Game, gameId, {
    // @ts-expect-error TODO: smth with first element in resolve object
    start: true,
    name: true,
    specs: {
      $each: true,
    },
    holes: {
      $each: true,
    },
    players: {
      $each: true,
    },
    rounds: {
      $each: true,
    },
  });
  return { game };
}
