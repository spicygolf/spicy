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
    isInitialLoad,
  } = useGameList(games);

  if (!games?.$isLoaded || isInitialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading games...</Text>
      </View>
    );
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No games yet? Time to get in the game! 🏌️
      </Text>
      <Text style={styles.emptySubtext}>
        Tap the "New Game" button above to start your first round
      </Text>
    </View>
  );

  return (
    <FlatList
      data={paginatedGames}
      renderItem={({ item }) => <GameListItem game={item} />}
      keyExtractor={(item) => item.$jazz.id}
      contentContainerStyle={styles.flatlist}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  loadingText: {
    marginTop: theme.gap(2),
    fontSize: 16,
    color: theme.colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
    marginTop: theme.gap(8),
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
  },
}));
