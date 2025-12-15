import type { CoList, MaybeLoaded } from "jazz-tools";
import { useMemo, useRef, useState } from "react";
import type { Game } from "spicylib/schema";

interface UseGameListResult {
  games: Game[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  isInitialLoad: boolean;
}

interface GameMetadata {
  id: string;
  startTime: number;
  game: MaybeLoaded<Game>;
}

export function useGameList(
  gamesList: MaybeLoaded<CoList<MaybeLoaded<Game>>> | undefined,
  initialCount = 20,
): UseGameListResult {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const lastGamesListId = useRef<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Reset visible count when games list changes
  const currentGamesListId = gamesList?.$isLoaded ? gamesList.$jazz.id : null;
  if (currentGamesListId !== lastGamesListId.current) {
    lastGamesListId.current = currentGamesListId;
    if (visibleCount !== initialCount) {
      setVisibleCount(initialCount);
    }
  }

  // First pass: collect all games with their IDs and start times (shallow load)
  const allGameMetadata = useMemo(() => {
    if (!gamesList?.$isLoaded) return [];

    const metadata: GameMetadata[] = [];
    for (const game of gamesList as Iterable<(typeof gamesList)[number]>) {
      if (game?.$isLoaded) {
        metadata.push({
          id: game.$jazz.id,
          startTime: game.start?.getTime() ?? 0,
          game,
        });
      }
    }

    // Sort by start time descending (newest first)
    const sorted = metadata.sort((a, b) => b.startTime - a.startTime);

    // Mark as loaded once we have processed all games in the list
    if (
      sorted.length === gamesList.length &&
      sorted.length > 0 &&
      !hasLoadedOnce
    ) {
      setHasLoadedOnce(true);
    }

    return sorted;
  }, [gamesList, hasLoadedOnce]);

  // Second pass: take only the visible games
  const visibleGames = useMemo(() => {
    const games = allGameMetadata
      .slice(0, visibleCount)
      .map((meta) => meta.game)
      .filter((game): game is Game => game?.$isLoaded);

    return games;
  }, [allGameMetadata, visibleCount]);

  if (!gamesList?.$isLoaded) {
    return {
      games: [],
      hasMore: false,
      loadMore: () => {},
      isLoading: false,
      isInitialLoad: true,
    };
  }

  // Show initial loading while games from the list are still being loaded
  // Once we've successfully loaded games, don't show it again (even if list becomes empty)
  const isInitialLoad = !hasLoadedOnce && gamesList.length > 0;

  const hasMore = visibleCount < allGameMetadata.length;

  const loadMore = (): void => {
    if (hasMore && !isLoading) {
      setIsLoading(true);
      setVisibleCount((prev) => prev + initialCount);
      // Use setTimeout to allow UI to update
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  return {
    games: visibleGames,
    hasMore,
    loadMore,
    isLoading,
    isInitialLoad,
  };
}
