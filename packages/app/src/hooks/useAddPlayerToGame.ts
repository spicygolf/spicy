import { err, type Result } from "neverthrow";
import type { Player } from "spicylib/schema";
import {
  type AddPlayerError,
  addPlayerToGameCore,
  type PlayerData,
} from "../utils/addPlayerToGameCore";
import { useGame } from "./useGame";
import { useJazzWorker } from "./useJazzWorker";

// Re-export types for consumers
export type { AddPlayerError, PlayerData } from "../utils/addPlayerToGameCore";

export interface UseAddPlayerError {
  type: AddPlayerError["type"] | "NO_WORKER_ACCOUNT";
  message: string;
}

export function useAddPlayerToGame() {
  const { game } = useGame(undefined, {
    resolve: {
      players: {
        $each: {
          name: true,
          handicap: true,
          rounds: true,
        },
      },
    },
  });
  const worker = useJazzWorker();

  const addPlayerToGame = async (
    p: PlayerData,
  ): Promise<Result<Player, UseAddPlayerError>> => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return err({
        type: "GAME_NOT_LOADED",
        message: "Game or players collection not loaded",
      });
    }

    if (!worker?.account?.$isLoaded) {
      return err({
        type: "NO_WORKER_ACCOUNT",
        message: "Worker account not loaded",
      });
    }

    return addPlayerToGameCore(game, p, worker.account);
  };

  return addPlayerToGame;
}
