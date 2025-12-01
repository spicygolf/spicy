import { useAccount } from "jazz-tools/react-native";
import { useCallback, useMemo } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameSpec } from "spicylib/schema";
import {
  FavoriteSpec,
  ListOfFavoriteSpecs,
  PlayerAccount,
} from "spicylib/schema";
import { SpecDescription } from "@/components/game/new/SpecDescription";
import { SpecListItem } from "@/components/game/new/SpecListItem";
import { useGamespecs } from "@/hooks";
import { Screen } from "@/ui";

interface NewGameSearchProps {
  viewMode: "list" | "description";
}

export function NewGameSearch({ viewMode }: NewGameSearchProps) {
  const { specs } = useGamespecs();

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
    select: (account) => {
      if (!account.$isLoaded) return null;
      if (!account.root?.$isLoaded) return null;
      return account;
    },
  });

  const favoriteSpecIds = useMemo(() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.specs?.$isLoaded
    ) {
      return new Set<string>();
    }
    return new Set(
      me.root.favorites.specs
        .filter((f) => f?.$isLoaded && f.spec?.$isLoaded)
        .map((f) => f.spec.$jazz.id),
    );
  }, [me]);

  const handleToggleFavorite = useCallback(
    async (spec: GameSpec) => {
      try {
        if (!me?.$isLoaded || !me.root?.$isLoaded) {
          return;
        }

        const root = me.root;

        // Initialize favorites if it doesn't exist
        if (!root.$jazz.has("favorites")) {
          const { Favorites } = await import("spicylib/schema");
          root.$jazz.set("favorites", Favorites.create({}, { owner: me }));
        }

        // Ensure favorites is loaded
        const loadedRoot = await root.$jazz.ensureLoaded({
          resolve: { favorites: true },
        });

        if (!loadedRoot.favorites?.$isLoaded) {
          return;
        }

        const favorites = loadedRoot.favorites;

        // Initialize specs list if it doesn't exist
        if (!favorites.$jazz.has("specs")) {
          favorites.$jazz.set(
            "specs",
            ListOfFavoriteSpecs.create([], { owner: me }),
          );
        }

        const loadedFavorites = await favorites.$jazz.ensureLoaded({
          resolve: { specs: true },
        });
        const specs = loadedFavorites.specs;
        if (!specs?.$isLoaded) return;

        const existingIndex = specs.findIndex(
          (f) =>
            f?.$isLoaded &&
            f.spec?.$isLoaded &&
            f.spec.$jazz.id === spec.$jazz.id,
        );

        if (existingIndex >= 0) {
          // Remove from favorites
          specs.$jazz.splice(existingIndex, 1);
        } else {
          // Add to favorites
          const newFavorite = FavoriteSpec.create(
            {
              spec,
              addedAt: new Date(),
            },
            { owner: me },
          );
          specs.$jazz.push(newFavorite);
        }
      } catch (error) {
        console.error("handleToggleFavorite error:", error);
      }
    },
    [me],
  );

  const loadedSpecs: GameSpec[] = specs || [];

  if (viewMode === "description") {
    return (
      <Screen>
        <SpecDescription
          specs={specs}
          favoriteSpecIds={favoriteSpecIds}
          onToggleFavorite={handleToggleFavorite}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <FlatList
          data={loadedSpecs}
          renderItem={({ item }) => (
            <SpecListItem
              spec={item}
              isFavorited={favoriteSpecIds.has(item.$jazz.id)}
              onToggleFavorite={handleToggleFavorite}
              showFavoriteButton={true}
            />
          )}
          keyExtractor={(item) => item.$jazz.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: theme.gap(1),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(4),
  },
}));
