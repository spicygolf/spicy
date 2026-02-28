import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback } from "react";
import { View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { StyleSheet } from "react-native-unistyles";
import type { CourseTee } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import { FavoriteTeeItem } from "@/components/game/settings/FavoriteTeeItem";
import { useFavoriteTeeActions, useGame } from "@/hooks";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import { Screen, Text } from "@/ui";

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseFavorites"
>;

export function SelectCourseFavorites({ route, navigation }: Props) {
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

  // Find the round via game.rounds (RoundToGame), not player.rounds
  // This is necessary because catalog players may not have the new round in their rounds list
  const round = (() => {
    if (!roundId || !game?.$isLoaded || !game.rounds?.$isLoaded) return null;
    const rtg = game.rounds.find(
      (r) => r?.$isLoaded && r.round?.$isLoaded && r.round.$jazz.id === roundId,
    );
    return rtg?.$isLoaded && rtg.round?.$isLoaded ? rtg.round : null;
  })();

  const allFavorites = (() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.courseTees?.$isLoaded
    ) {
      return [];
    }
    // Filter by player gender
    return me.root.favorites.courseTees.filter((fav) => {
      if (!fav?.$isLoaded || !fav.$jazz.has("tee") || !fav.tee?.$isLoaded)
        return false;
      const teeGender = fav.tee.gender;
      const playerGender = player?.$isLoaded ? player.gender : "M";
      // Show mixed tees and gender-matching tees
      return teeGender === "Mixed" || teeGender === playerGender;
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

  const handleReorder = useCallback(
    ({ data }: { data: MaybeLoaded<CourseTee>[] }) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.courseTees?.$isLoaded
      ) {
        return;
      }

      const courseTees = me.root.favorites.courseTees;

      // Preserve favorites hidden by gender filter (they aren't in `data`)
      const reorderedIds = new Set(
        data
          .filter((d): d is CourseTee & { $isLoaded: true } => !!d?.$isLoaded)
          .map((d) => d.$jazz.id),
      );
      const hiddenItems = courseTees.filter(
        (existing) =>
          !existing?.$isLoaded || !reorderedIds.has(existing.$jazz.id),
      );

      // Clear and rebuild: reordered visible items first, then hidden items
      while (courseTees.length > 0) {
        courseTees.$jazz.splice(0, 1);
      }
      for (const item of [...data, ...hiddenItems]) {
        // biome-ignore lint/suspicious/noExplicitAny: Jazz list type compatibility
        courseTees.$jazz.push(item as any);
      }
    },
    [me],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<MaybeLoaded<CourseTee>>) => {
      return (
        <FavoriteTeeItem
          item={item}
          drag={drag}
          isActive={isActive}
          onPress={() => handleSelectTee(item)}
          onRemove={() => removeFavorite(item)}
        />
      );
    },
    [handleSelectTee, removeFavorite],
  );

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

  if (allFavorites.length === 0) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <FontAwesome6
            name="star"
            iconStyle="regular"
            size={48}
            color="#999"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Favorite Tees Yet</Text>
          <Text style={styles.emptyText}>
            When you favorite a tee from the search tab,{"\n"}it will appear
            here for quick access.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <DraggableFlatList
        data={allFavorites}
        keyExtractor={(item) => item.$jazz.id}
        renderItem={renderItem}
        onDragEnd={handleReorder}
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
  emptyIcon: {
    marginBottom: theme.gap(2),
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
