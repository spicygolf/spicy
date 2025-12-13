import type { CoList, MaybeLoaded } from "jazz-tools";
import { ActivityIndicator, FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { GameListItem } from "@/components/game/list/GameListItem";
import { useGameList } from "@/hooks/useGameList";
import { Text } from "@/ui";

export function GameList({
  games,
}: {
  games: MaybeLoaded<CoList<MaybeLoaded<Game>>> | undefined;
}) {
  const {
    games: paginatedGames,
    hasMore,
    loadMore,
    isLoading,
  } = useGameList(games);

  if (!games?.$isLoaded) {
    return null;
  }

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text style={styles.loadMoreText}>Pull to load more...</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={paginatedGames}
      renderItem={({ item }) => <GameListItem game={item} />}
      keyExtractor={(item) => item.$jazz.id}
      contentContainerStyle={styles.flatlist}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  flatlist: {
    marginVertical: theme.gap(1),
  },
  footer: {
    paddingVertical: theme.gap(2),
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
