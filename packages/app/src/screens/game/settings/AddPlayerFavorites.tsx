import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { type FavoritePlayer, PlayerAccount } from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import {
  type RenderItemParams,
  SafeDraggableFlatList,
} from "@/components/common/SafeDraggableFlatList";
import { useGameContext } from "@/contexts/GameContext";
import { useAddPlayerToGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Screen, Text } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function AddPlayerFavorites() {
  const { navigate } = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();
  const { game } = useGameContext();
  const { theme } = useUnistyles();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          players: {
            $each: {
              player: {
                clubs: { $each: true },
                handicap: true,
              },
            },
          },
        },
      },
    },
  });

  const favoritedPlayers = useMemo(() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.players?.$isLoaded
    ) {
      return [];
    }
    return me.root.favorites.players;
  }, [me]);

  const handleSelectPlayer = useCallback(
    async (favorite: FavoritePlayer) => {
      if (!favorite?.$isLoaded || !favorite.player?.$isLoaded) {
        return;
      }

      await favorite.player.$jazz.ensureLoaded({
        resolve: {
          clubs: { $each: true },
        },
      });

      const player = favorite.player;
      const result = await addPlayerToGame({
        name: player.name,
        email: player.email,
        short: player.short,
        gender: player.gender,
        ghinId: player.ghinId,
        handicap: player.handicap?.$isLoaded
          ? {
              source: player.handicap.source,
              display: player.handicap.display,
              value: player.handicap.value,
              revDate: player.handicap.revDate,
            }
          : undefined,
      });

      if (result.isOk()) {
        const newPlayer = result.value;
        navigate("AddRoundToGame", { playerId: newPlayer.$jazz.id });
      } else {
        console.error(result.error);
      }
    },
    [addPlayerToGame, navigate],
  );

  const removeFavorite = useCallback(
    async (favorite: FavoritePlayer) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.players?.$isLoaded
      ) {
        return;
      }

      const players = me.root.favorites.players;
      const index = players.findIndex((f) => f?.$jazz.id === favorite.$jazz.id);
      if (index >= 0) {
        players.$jazz.splice(index, 1);
      }
    },
    [me],
  );

  const handleReorder = useCallback(
    ({ data }: { data: MaybeLoaded<FavoritePlayer>[] }) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded ||
        !me.root.favorites.players?.$isLoaded
      ) {
        return;
      }

      const players = me.root.favorites.players;

      // Clear and rebuild list in new order
      while (players.length > 0) {
        players.$jazz.splice(0, 1);
      }
      for (const item of data) {
        // Type assertion needed because items from DraggableFlatList are already loaded
        // biome-ignore lint/suspicious/noExplicitAny: Jazz list type compatibility
        players.$jazz.push(item as any);
      }
    },
    [me],
  );

  // Check if player is already in the game
  const isPlayerAlreadyAdded = useCallback(
    (ghinId: string | undefined) => {
      if (!ghinId || !game?.players?.$isLoaded) return false;
      return game.players.some(
        (player) => player?.$isLoaded && player.ghinId === ghinId,
      );
    },
    [game],
  );

  const renderItem = useCallback(
    ({
      item,
      drag,
      isActive,
    }: RenderItemParams<MaybeLoaded<FavoritePlayer>>) => {
      if (!item?.$isLoaded || !item.player?.$isLoaded) {
        return null;
      }

      const player = item.player;
      const isAlreadyAdded = isPlayerAlreadyAdded(player.ghinId);

      // Format clubs display
      let clubsDisplay = "";
      if (player.clubs?.$isLoaded && player.clubs.length > 0) {
        clubsDisplay = player.clubs
          .map((club) => {
            if (!club?.$isLoaded) return "";
            return club.state ? `${club.name}, ${club.state}` : club.name;
          })
          .filter(Boolean)
          .join(" • ");
      }

      return (
        <TouchableOpacity
          style={[
            styles.favoriteItem,
            isActive && styles.draggingItem,
            isAlreadyAdded && styles.disabledItem,
          ]}
          onPress={() => !isAlreadyAdded && handleSelectPlayer(item)}
          onLongPress={drag}
          delayLongPress={200}
          disabled={isAlreadyAdded}
        >
          <View style={styles.faveContainer}>
            <FavoriteButton
              isFavorited={true}
              onToggle={() => removeFavorite(item)}
              size={24}
            />
          </View>

          <View style={styles.playerContainer}>
            <View style={styles.playerNameContainer}>
              <Text
                style={[
                  styles.playerName,
                  isAlreadyAdded && styles.playerNameDisabled,
                ]}
              >
                {player.name}
                {isAlreadyAdded && " ✓"}
              </Text>
              {clubsDisplay && (
                <Text
                  style={[
                    styles.playerClub,
                    isAlreadyAdded && styles.playerClubDisabled,
                  ]}
                >
                  {clubsDisplay}
                </Text>
              )}
            </View>

            <View style={styles.handicapContainer}>
              {player.handicap?.$isLoaded && player.handicap.display && (
                <Text
                  style={[
                    styles.handicap,
                    isAlreadyAdded && styles.handicapDisabled,
                  ]}
                >
                  {player.handicap.display}
                </Text>
              )}
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
        </TouchableOpacity>
      );
    },
    [handleSelectPlayer, removeFavorite, isPlayerAlreadyAdded, theme],
  );

  if (favoritedPlayers.length === 0) {
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
          <Text style={styles.emptyTitle}>No Favorite Players Yet</Text>
          <Text style={styles.emptyText}>
            When you favorite a player from the GHIN® search tab,{"\n"}they will
            appear here for quick access.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeDraggableFlatList
        data={favoritedPlayers as MaybeLoaded<FavoritePlayer>[]}
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.gap(1),
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
  disabledItem: {
    opacity: 0.6,
  },
  faveContainer: {
    width: "10%",
    justifyContent: "center",
  },
  playerContainer: {
    width: "90%",
    flexDirection: "row",
  },
  playerNameContainer: {
    width: "70%",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  playerNameDisabled: {
    color: theme.colors.secondary,
  },
  playerClub: {
    fontSize: 11,
    fontStyle: "italic",
    flexWrap: "wrap",
  },
  playerClubDisabled: {
    color: theme.colors.secondary,
    fontStyle: "italic",
  },
  handicapContainer: {
    width: "15%",
    justifyContent: "center",
  },
  handicap: {
    fontSize: 18,
    textAlign: "right",
  },
  handicapDisabled: {
    color: theme.colors.secondary,
  },
  dragHandle: {
    width: "15%",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: theme.gap(1),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
