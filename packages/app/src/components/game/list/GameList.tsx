import type { CoList, MaybeLoaded } from "jazz-tools";
import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { GameListItem } from "@/components/game/list/GameListItem";

export function GameList({
  games,
}: {
  games: MaybeLoaded<CoList<MaybeLoaded<Game>>> | undefined;
}) {
  if (!games?.$isLoaded) {
    return null;
  }

  // Just access Jazz data directly - no hooks needed
  const loadedGames: Game[] = [];
  for (const game of games as Iterable<(typeof games)[number]>) {
    if (game?.$isLoaded) {
      loadedGames.push(game);
    }
  }

  const sortedGames = loadedGames.sort((a, b) => {
    const dateA = a.start?.getTime() ?? 0;
    const dateB = b.start?.getTime() ?? 0;
    return dateB - dateA;
  });

  return (
    <FlatList
      data={sortedGames}
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
