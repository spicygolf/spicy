import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { FavoriteSpec, GameSpec } from "spicylib/schema";
import { type ListOfGameSpecs, PlayerAccount } from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { SpecDescription } from "@/components/game/new/SpecDescription";
import { useCreateGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Screen, Text } from "@/ui";

interface NewGameFavoritesProps {
  viewMode: "list" | "description";
}

export function NewGameFavorites({ viewMode }: NewGameFavoritesProps) {
  const navigation = useNavigation<NavigationProp<GamesNavigatorParamList>>();
  const { createGame } = useCreateGame();
  const { theme } = useUnistyles();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          specs: {
            $each: {
              spec: true,
            },
          },
        },
      },
    },
  });

  const favoritedSpecs = useMemo(() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.specs?.$isLoaded
    ) {
      return [];
    }
    return me.root.favorites.specs;
  }, [me]);

  const handleSelectSpec = useCallback(
    async (spec: GameSpec) => {
      const game = await createGame(spec.name, [spec]);
      if (!game) return;
      navigation.navigate("Game", {
        gameId: game.$jazz.id,
      });
    },
    [createGame, navigation],
  );

  const removeFavorite = useCallback(
    async (favorite: FavoriteSpec) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.specs?.$isLoaded
      ) {
        return;
      }

      const specs = me.root.favorites.specs;
      const index = specs.findIndex((f) => f?.$jazz.id === favorite.$jazz.id);
      if (index >= 0) {
        specs.$jazz.splice(index, 1);
      }
    },
    [me],
  );

  const handleReorder = useCallback(
    ({ data }: { data: MaybeLoaded<FavoriteSpec>[] }) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.specs?.$isLoaded
      ) {
        return;
      }

      const specs = me.root.favorites.specs;

      // Clear and rebuild list in new order
      while (specs.length > 0) {
        specs.$jazz.splice(0, 1);
      }
      for (const item of data) {
        // biome-ignore lint/suspicious/noExplicitAny: Jazz list type compatibility
        specs.$jazz.push(item as any);
      }
    },
    [me],
  );

  const renderListItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<MaybeLoaded<FavoriteSpec>>) => {
      if (!item?.$isLoaded || !item.spec?.$isLoaded) {
        return null;
      }

      const spec = item.spec;

      return (
        <TouchableOpacity
          style={[styles.favoriteItem, isActive && styles.draggingItem]}
          onPress={() => handleSelectSpec(spec)}
          onLongPress={drag}
          delayLongPress={200}
        >
          <View style={styles.itemRow}>
            <FavoriteButton
              isFavorited={true}
              onToggle={() => removeFavorite(item)}
              size={20}
            />

            <View style={styles.contentArea}>
              <View style={styles.topRow}>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.specName}>{spec.name}</Text>
                  <Text style={styles.specSub}>
                    {spec.spec_type} • {spec.short}
                  </Text>
                </View>

                <View style={styles.dragHandle}>
                  <FontAwesome6
                    name="grip-lines"
                    iconStyle="solid"
                    size={16}
                    color={theme.colors.secondary}
                  />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectSpec, removeFavorite, theme],
  );

  if (favoritedSpecs.length === 0) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <FontAwesome6
            name="star"
            iconStyle="regular"
            size={48}
            color={theme.colors.secondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Favorite Game Specs Yet</Text>
          <Text style={styles.emptyText}>
            When you favorite a game spec from the search tab,{"\n"}it will
            appear here for quick access.
          </Text>
        </View>
      </Screen>
    );
  }

  if (viewMode === "description") {
    // Convert the array of specs to a ListOfGameSpecs-like structure
    const specsArray = favoritedSpecs
      .filter((f) => f?.$isLoaded && f.spec?.$isLoaded)
      .map((f) => f.spec);

    // Create a set of favorited spec IDs (all specs in this view are favorited)
    const favoriteSpecIds = new Set(specsArray.map((s) => s.$jazz.id));

    // Handle unfavoriting a spec
    const handleToggleFavorite = (spec: GameSpec) => {
      const favorite = favoritedSpecs.find(
        (f) =>
          f?.$isLoaded &&
          f.spec?.$isLoaded &&
          f.spec.$jazz.id === spec.$jazz.id,
      );
      if (favorite) {
        removeFavorite(favorite);
      }
    };

    // Create a mock list structure that SpecDescription expects
    const specsList = {
      $isLoaded: true,
      filter: (fn: (spec: GameSpec) => boolean) => specsArray.filter(fn),
    } as ListOfGameSpecs;

    return (
      <Screen>
        <SpecDescription
          specs={specsList}
          favoriteSpecIds={favoriteSpecIds}
          onToggleFavorite={handleToggleFavorite}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <DraggableFlatList
        data={favoritedSpecs as MaybeLoaded<FavoriteSpec>[]}
        keyExtractor={(item) => item.$jazz.id}
        renderItem={renderListItem}
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
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(2),
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentArea: {
    flex: 1,
    marginLeft: theme.gap(1),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteInfo: {
    flex: 1,
  },
  specName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  specSub: {
    fontSize: 14,
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
    marginLeft: theme.gap(4),
  },
}));
