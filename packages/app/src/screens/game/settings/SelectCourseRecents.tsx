import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { FavoriteTeeItem } from "@/components/game/settings/FavoriteTeeItem";
import { useFavoriteTeeActions, useGame } from "@/hooks";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import { Screen, Text } from "@/ui";

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseRecents"
>;

export function SelectCourseRecents({ route, navigation }: Props) {
  const { playerId, roundId } = route.params;
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true } },
      rounds: { $each: { round: true } },
    },
  });

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          courseTees: {
            $each: true,
          },
        },
      },
    },
  });

  const player = (() => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return null;
    }
    return (
      game.players.find(
        (p: MaybeLoaded<(typeof game.players)[0]>) =>
          p?.$isLoaded && p.$jazz.id === playerId,
      ) || null
    );
  })();

  const round = (() => {
    if (!roundId || !game?.$isLoaded || !game.rounds?.$isLoaded) return null;
    const rtg = game.rounds.find(
      (r) => r?.$isLoaded && r.round?.$isLoaded && r.round.$jazz.id === roundId,
    );
    return rtg?.$isLoaded && rtg.round?.$isLoaded ? rtg.round : null;
  })();

  const recentTees = (() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.courseTees?.$isLoaded
    ) {
      return [];
    }
    const playerGender = player?.$isLoaded ? player.gender : "M";
    const withLastUsed = me.root.favorites.courseTees.filter((fav) => {
      if (!fav?.$isLoaded || !fav.$jazz.has("tee") || !fav.tee?.$isLoaded)
        return false;
      if (!fav.lastUsedAt) return false;
      const teeGender = fav.tee.gender;
      return teeGender === "Mixed" || teeGender === playerGender;
    });
    return withLastUsed.sort((a, b) => {
      const aTime = a?.$isLoaded && a.lastUsedAt ? a.lastUsedAt.getTime() : 0;
      const bTime = b?.$isLoaded && b.lastUsedAt ? b.lastUsedAt.getTime() : 0;
      return bTime - aTime;
    });
  })();

  const goBack = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  const { handleSelectTee, removeFavorite } = useFavoriteTeeActions({
    round,
    game,
    player,
    me,
    goBack,
  });

  if (!player) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Loading player data...</Text>
        </View>
      </Screen>
    );
  }

  if (!round) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>No round selected</Text>
        </View>
      </Screen>
    );
  }

  if (recentTees.length === 0) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Recent Tees</Text>
          <Text style={styles.emptyText}>
            Courses you've used in past games{"\n"}will appear here.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={recentTees}
        keyExtractor={(item) => item.$jazz.id}
        renderItem={({ item }) => (
          <FavoriteTeeItem
            item={item}
            onPress={() => handleSelectTee(item)}
            onRemove={() => removeFavorite(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: theme.gap(5),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
