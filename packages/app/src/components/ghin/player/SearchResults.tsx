import type { Golfer } from "@spicygolf/ghin";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { PlayerItem } from "@/components/game/settings/PlayerItem";
import { GhinPlayerSearchContext } from "@/contexts/GhinPlayerSearchContext";
import { useGhinSearchPlayerQuery } from "@/hooks/useGhinSearchPlayerQuery";
import { Text } from "@/ui";

export function GhinPlayerSearchResults() {
  const { state } = useContext(GhinPlayerSearchContext);

  const [page, setPage] = useState(1);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const per_page = 25;

  const { isPending, isError, error, data } = useGhinSearchPlayerQuery({
    ...state,
    page,
    per_page,
  });

  // if state changes at all, reset everything
  useEffect(() => {
    setPage(1);
    setGolfers([]);
  }, []);

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setGolfers(data);
      } else {
        setGolfers((g) => g.concat(data));
      }
    }
  }, [data, page]);

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    // TODO: error component
    return <Text>{error.message}</Text>;
  }

  const keyExtractor = (g: Golfer) =>
    `${g?.ghin}-${g?.club_id}-${g?.last_name}-${g?.first_name}`;

  return (
    <FlatList
      data={golfers}
      renderItem={({ item }) => <PlayerItem item={item} />}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={0.8}
      onEndReached={async () => {
        // TODO: I wasn't tracking on the whole state.handicap.id thing here.
        //       Maybe if it's full, a player has been selected and we can stop?
        // // should only be in 'search' part where we want to peform
        // // infinite scroll pagination
        // if (state.last_name && state.handicap?.id) {
        //   return;
        // }

        // data is as long as per_page, so we're not at end yet
        if (data?.length === per_page) {
          setPage((p) => p + 1);
        }
      }}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.no_results}>No Results</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  emptyContainer: {
    flex: 1,
  },
  no_results: {
    alignSelf: "center",
    color: "#999",
    fontSize: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
