import type { CoList, MaybeLoaded } from "jazz-tools";
import { useRef } from "react";
import { FlatList, View } from "react-native";
import type { Game } from "spicylib/schema";
import { GameListItem } from "@/components/game/list/GameListItem";

export function GameList({
  games,
}: {
  games: MaybeLoaded<CoList<MaybeLoaded<Game>>> | undefined;
}) {
  const lastLoadedGames = useRef<Game[]>([]);

  const currentLoadedGames = games?.$isLoaded
    ? games.filter((g) => g?.$isLoaded)
    : [];

  if (currentLoadedGames.length > 0) {
    lastLoadedGames.current = currentLoadedGames;
  }

  const sortGamesByDate = (games: Game[]) => {
    return [...games].sort((a, b) => {
      const dateA = a?.start?.getTime() ?? 0;
      const dateB = b?.start?.getTime() ?? 0;
      return dateB - dateA; // descending order (newest first)
    });
  };

  const displayGames =
    currentLoadedGames.length > 0
      ? sortGamesByDate(currentLoadedGames)
      : sortGamesByDate(lastLoadedGames.current);

  if (!games && displayGames.length === 0) {
    return null;
  }

  return (
    <View>
      <FlatList
        data={displayGames}
        renderItem={({ item }) => <GameListItem game={item} />}
        keyExtractor={(item) => item.$jazz.id}
      />
    </View>
  );
}
