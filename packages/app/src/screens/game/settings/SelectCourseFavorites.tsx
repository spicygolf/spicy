import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CourseTee } from "spicylib/schema";
import { PlayerAccount } from "spicylib/schema";
import { stateCode } from "spicylib/utils";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import {
  type RenderItemParams,
  SafeDraggableFlatList,
} from "@/components/common/SafeDraggableFlatList";
import { useGameContext } from "@/contexts/GameContext";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import { Screen, Text } from "@/ui";

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseFavorites"
>;

export function SelectCourseFavorites({ route, navigation }: Props) {
  const { playerId, roundId } = route.params;
  const { game } = useGameContext();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          courseTees: {
            $each: {
              course: {
                facility: true,
              },
              tee: {
                holes: { $each: true },
              },
            },
          },
        },
      },
    },
  });

  const player = useMemo(() => {
    if (!game?.players?.$isLoaded) {
      return null;
    }
    return (
      game.players.find((p) => p?.$isLoaded && p.$jazz.id === playerId) || null
    );
  }, [game?.players, playerId]);

  const round = useMemo(() => {
    if (!roundId || !player?.$isLoaded || !player.rounds?.$isLoaded)
      return null;
    return (
      player.rounds.find((r) => r?.$isLoaded && r.$jazz.id === roundId) || null
    );
  }, [player, roundId]);

  const favoritedTees = useMemo(() => {
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
      if (!fav?.$isLoaded || !fav.tee?.$isLoaded) return false;
      const teeGender = fav.tee.gender;
      const playerGender = player?.$isLoaded ? player.gender : "M";
      // Show mixed tees and gender-matching tees
      return teeGender === "Mixed" || teeGender === playerGender;
    });
  }, [me, player]);

  const handleSelectTee = useCallback(
    async (favorite: CourseTee) => {
      if (
        !round?.$isLoaded ||
        !favorite?.$isLoaded ||
        !favorite.course?.$isLoaded ||
        !favorite.tee?.$isLoaded
      ) {
        return;
      }

      // Set the course and tee on the round
      round.$jazz.set("course", favorite.course);
      round.$jazz.set("tee", favorite.tee);

      navigation.getParent()?.goBack();
    },
    [round, navigation],
  );

  const removeFavorite = useCallback(
    async (favorite: CourseTee) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.courseTees?.$isLoaded
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
      if (!item?.$isLoaded || !item.course?.$isLoaded || !item.tee?.$isLoaded) {
        return null;
      }

      const course = item.course;
      const tee = item.tee;

      return (
        <TouchableOpacity
          style={[styles.favoriteItem, isActive && styles.draggingItem]}
          onPress={() => handleSelectTee(item)}
          onLongPress={drag}
          delayLongPress={200}
        >
          <FavoriteButton
            isFavorited={true}
            onToggle={() => removeFavorite(item)}
            size={20}
          />

          <View style={styles.favoriteInfo}>
            <Text style={styles.teeName}>{tee.name}</Text>
            <Text style={styles.courseName}>{course.name}</Text>
            {course.facility?.$isLoaded &&
              course.facility.name !== course.name && (
                <Text style={styles.facilityName}>{course.facility.name}</Text>
              )}
            <Text style={styles.courseLocation}>
              {course.city}, {stateCode(course.state)}
            </Text>
            <Text style={styles.teeDetailText}>
              {tee.gender} • {tee.totalYardage} yards • Par{" "}
              {tee.holes?.$isLoaded
                ? tee.holes.reduce(
                    (sum, h) => sum + (h?.$isLoaded ? h.par : 0),
                    0,
                  )
                : "—"}
              {tee.ratings?.$isLoaded && tee.ratings.total?.$isLoaded && (
                <>
                  {" "}
                  • Rating: {tee.ratings.total.rating.toFixed(1)} • Slope:{" "}
                  {tee.ratings.total.slope}
                </>
              )}
            </Text>
          </View>

          <View style={styles.dragHandle}>
            <FontAwesome6
              name="grip-lines"
              iconStyle="solid"
              size={16}
              color="#999"
            />
          </View>
        </TouchableOpacity>
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
      <SafeDraggableFlatList
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
  favoriteItem: {
    paddingVertical: theme.gap(0.5),
    paddingRight: theme.gap(2),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  draggingItem: {
    opacity: 0.7,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  favoriteInfo: {
    flex: 1,
    marginHorizontal: theme.gap(1),
  },
  teeName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  courseName: {
    fontSize: 15,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  facilityName: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  courseLocation: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  teeDetailText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  dragHandle: {
    padding: theme.gap(1),
    marginLeft: theme.gap(1),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
