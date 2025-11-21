import type { CoList, MaybeLoaded } from "jazz-tools";
import { useRef } from "react";
import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
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
    <FlatList
      data={displayGames}
      renderItem={({ item }) => <GameListItem game={item} />}
      keyExtractor={(item) => item.$jazz.id}
      contentContainerStyle={styles.flatlist}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  flatlist: {
    marginVertical: theme.gap(1),
  },
}));
