import type { MaybeLoaded } from "jazz-tools";
import { useCoState } from "jazz-tools/react-native";
import { useEffect, useRef } from "react";
import { Game } from "spicylib/schema";
import { useGameIdContext } from "@/contexts/GameContext";

interface UseGameOptions {
  requireGame?: boolean;
  resolve?: Record<string, unknown>;
  select?: (game: MaybeLoaded<Game>) => Game | null | undefined;
}

type GameWithRelations = Game | null;

/**
 * Default select function for useGame.
 * Defined at module scope so the reference is stable across renders.
 */
function defaultSelect(value: MaybeLoaded<Game>): Game | null | undefined {
  if (!value.$isLoaded) {
    return value.$jazz.loadingState === "loading" ? undefined : null;
  }
  return value;
}

/**
 * Build a fingerprint string that captures the Game's loaded state deeply
 * enough to detect meaningful changes. Jazz fires dozens of notifications
 * per logical change (one per child scope); this fingerprint collapses them
 * into a single value that only changes when actual data changes.
 */
function gameFingerprint(game: Game | null | undefined): string {
  if (!game) return "null";
  if (!game.$isLoaded) return "loading";

  const raw = game.$jazz?.raw;
  // Start with the Game's own version
  const parts: string[] = [
    `v:${raw?.totalValidTransactions ?? 0}:${raw?.version ?? 0}`,
  ];

  // Include loaded state of key children — these change during progressive loading
  if (game.spec?.$isLoaded) {
    const specRaw = game.spec.$jazz?.raw;
    parts.push(`spec:${specRaw?.totalValidTransactions ?? 0}`);
  } else {
    parts.push("spec:_");
  }

  if (game.players?.$isLoaded) {
    parts.push(`pl:${game.players.length}`);
    for (const p of game.players) {
      if (p?.$isLoaded) {
        const pRaw = p.$jazz?.raw;
        parts.push(`p:${pRaw?.totalValidTransactions ?? 0}`);
      }
    }
  } else {
    parts.push("pl:_");
  }

  if (game.rounds?.$isLoaded) {
    parts.push(`rd:${game.rounds.length}`);
    for (const r of game.rounds) {
      if (r?.$isLoaded) {
        const rRaw = r.$jazz?.raw;
        parts.push(`r:${rRaw?.totalValidTransactions ?? 0}`);
        if (r.round?.$isLoaded) {
          const rrRaw = r.round.$jazz?.raw;
          parts.push(`rr:${rrRaw?.totalValidTransactions ?? 0}`);
        }
      }
    }
  } else {
    parts.push("rd:_");
  }

  if (game.holes?.$isLoaded) {
    parts.push(`h:${game.holes.length}`);
  } else {
    parts.push("h:_");
  }

  if (game.scope?.$isLoaded) {
    const sRaw = game.scope.$jazz?.raw;
    parts.push(`sc:${sRaw?.totalValidTransactions ?? 0}`);
  } else {
    parts.push("sc:_");
  }

  return parts.join("|");
}

/**
 * Equality function that prevents re-renders when the Game's meaningful
 * data hasn't changed. Jazz fires triggerUpdate() for every child scope
 * update (dozens per field change), each creating a new object reference.
 * This compares a fingerprint of loaded state + version counters instead
 * of comparing by object reference.
 */
function gameEqualityFn(
  a: Game | null | undefined,
  b: Game | null | undefined,
): boolean {
  return gameFingerprint(a) === gameFingerprint(b);
}

/**
 * Hook to load a Game with customizable resolve queries.
 *
 * Uses a fingerprint-based equality function to prevent the render cascade
 * caused by Jazz's subscription architecture. Jazz fires triggerUpdate() for
 * each child scope update, creating dozens of new object references per
 * single field change. The equality function compares a deep fingerprint
 * of loaded state + version counters, collapsing these into a single
 * effective re-render per meaningful change.
 *
 * @param gameId - Game ID to load (optional, falls back to context)
 * @param options - Configuration options
 * @param options.requireGame - Throw error if no game ID available
 * @param options.resolve - Custom Jazz resolve query (RECOMMENDED: always specify)
 */
export function useGame(
  gameId?: string,
  options: UseGameOptions = {},
): { game: GameWithRelations } {
  const { gameId: ctxGameId } = useGameIdContext();
  const effectiveGameId = gameId || ctxGameId || undefined;
  const startTime = useRef(Date.now());
  const loggedLoad = useRef(false);

  // Use custom resolve if provided, otherwise use default minimal resolve
  const resolveQuery = options.resolve || {
    name: true,
    start: true,
    scope: { teamsConfig: true },
    spec: { $each: { $each: true } },
    holes: true,
    players: { $each: { name: true, handicap: true, envs: true } },
    rounds: {
      $each: {
        handicapIndex: true,
        courseHandicap: true,
        gameHandicap: true,
        round: {
          playerId: true,
          handicapIndex: true,
          tee: {
            holes: { $each: true },
          },
          scores: true,
        },
      },
    },
  };

  const game = useCoState(
    Game,
    effectiveGameId,
    // @ts-expect-error Jazz type inference for dynamic resolve + select + equalityFn is too complex
    effectiveGameId
      ? {
          resolve: resolveQuery,
          select: options.select || defaultSelect,
          equalityFn: gameEqualityFn,
        }
      : undefined,
  ) as GameWithRelations;

  // Performance tracking (dev only)
  useEffect(() => {
    if (__DEV__ && game?.$isLoaded && !loggedLoad.current) {
      loggedLoad.current = true;
      const elapsed = Date.now() - startTime.current;
      console.log("[PERF] useGame LOADED", {
        elapsed,
        gameId: game.$jazz.id,
      });
    }
  }, [game]);

  if (!effectiveGameId) {
    if (options.requireGame) {
      throw new Error("No game ID provided and no current game in context");
    }
    return { game: null };
  }

  return { game };
}
