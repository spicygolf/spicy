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
import { useGame } from "@/hooks";
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
      players: { $each: { gender: true, rounds: { $each: true } } },
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
    if (!roundId || !player?.$isLoaded || !player.rounds?.$isLoaded)
      return null;
    return (
      player.rounds.find(
        (r: MaybeLoaded<(typeof player.rounds)[0]>) =>
          r?.$isLoaded && r.$jazz.id === roundId,
      ) || null
    );
  })();

  const favoritedTees = (() => {
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

  const handleSelectTee = useCallback(
    async (favorite: MaybeLoaded<CourseTee>) => {
      if (!round?.$isLoaded || !favorite?.$isLoaded) {
        return;
      }

      // Ensure course and tee are loaded
      const loadedFavorite = await favorite.$jazz.ensureLoaded({
        resolve: {
          course: true,
          tee: true,
        },
      });

      if (!loadedFavorite.course?.$isLoaded || !loadedFavorite.tee?.$isLoaded) {
        return;
      }

      // Set the course and tee on the round
      round.$jazz.set("course", loadedFavorite.course);
      round.$jazz.set("tee", loadedFavorite.tee);

      navigation.getParent()?.goBack();
    },
    [round, navigation],
  );

  const removeFavorite = useCallback(
    async (favorite: MaybeLoaded<CourseTee>) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.courseTees?.$isLoaded ||
        !favorite?.$isLoaded
      ) {
        return;
      }

      const courseTees = me.root.favorites.courseTees;
      const index = courseTees.findIndex(
        (f) => f?.$jazz.id === favorite.$jazz.id,
      );
      if (index >= 0) {
        courseTees.$jazz.splice(index, 1);
      }
    },
    [me],
  );

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

      // Clear and rebuild list in new order
      while (courseTees.length > 0) {
        courseTees.$jazz.splice(0, 1);
      }
      for (const item of data) {
        // Type assertion needed because items from DraggableFlatList are already loaded
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

  if (favoritedTees.length === 0) {
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
        data={favoritedTees}
        keyExtractor={(item) => item.$jazz.id}
        renderItem={renderItem}
        onDragEnd={handleReorder}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
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
    paddingBottom: theme.gap(1),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
