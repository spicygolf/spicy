import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useCallback } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { type FavoritePlayer, PlayerAccount } from "spicylib/schema";
import { useAddPlayerToGame, useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Screen, Text } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function AddPlayerRecents() {
  const navigation = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { ghinId: true } },
    },
  });
  const { theme } = useUnistyles();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          recentPlayers: {
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

  const recentPlayers = (() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.recentPlayers?.$isLoaded
    ) {
      return [];
    }
    const withLastUsed = me.root.favorites.recentPlayers.filter(
      (fp) => fp?.$isLoaded && fp.lastUsedAt,
    );
    return withLastUsed.sort((a, b) => {
      const aTime = a?.$isLoaded && a.lastUsedAt ? a.lastUsedAt.getTime() : 0;
      const bTime = b?.$isLoaded && b.lastUsedAt ? b.lastUsedAt.getTime() : 0;
      return bTime - aTime;
    });
  })();

  const handleSelectPlayer = useCallback(
    async (favorite: FavoritePlayer) => {
      if (!favorite?.$isLoaded || !favorite.player?.$isLoaded) {
        return;
      }

      const result = await addPlayerToGame(favorite.player);

      if (result.isOk()) {
        const { player, roundAutoCreated } = result.value;
        if (!roundAutoCreated) {
          navigation.navigate("AddRoundToGame", { playerId: player.$jazz.id });
        }
      } else {
        console.error(result.error);
      }
    },
    [addPlayerToGame, navigation],
  );

  const isPlayerAlreadyAdded = useCallback(
    (playerId: string | undefined) => {
      if (!playerId || !game?.$isLoaded || !game.players?.$isLoaded)
        return false;
      return game.players.some(
        (player: MaybeLoaded<(typeof game.players)[0]>) =>
          player?.$isLoaded && player.$jazz.id === playerId,
      );
    },
    [game],
  );

  const renderItem = useCallback(
    ({ item }: { item: MaybeLoaded<FavoritePlayer> }) => {
      if (!item?.$isLoaded || !item.player?.$isLoaded) {
        return null;
      }

      const player = item.player;
      const isAlreadyAdded = isPlayerAlreadyAdded(player.$jazz.id);
      const isManual = !player.ghinId;

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
          style={[styles.playerItem, isAlreadyAdded && styles.disabledItem]}
          onPress={() => !isAlreadyAdded && handleSelectPlayer(item)}
          disabled={isAlreadyAdded}
        >
          <View style={styles.iconContainer}>
            <FontAwesome6
              name={isManual ? "user-pen" : "user"}
              iconStyle="solid"
              size={16}
              color={theme.colors.secondary}
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
              {clubsDisplay ? (
                <Text
                  style={[
                    styles.playerClub,
                    isAlreadyAdded && styles.playerClubDisabled,
                  ]}
                >
                  {clubsDisplay}
                </Text>
              ) : isManual ? (
                <Text
                  style={[
                    styles.playerClub,
                    isAlreadyAdded && styles.playerClubDisabled,
                  ]}
                >
                  Manual player
                </Text>
              ) : null}
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
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectPlayer, isPlayerAlreadyAdded, theme],
  );

  if (recentPlayers.length === 0) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <FontAwesome6
            name="clock-rotate-left"
            iconStyle="solid"
            size={48}
            color={theme.colors.secondary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Recent Players</Text>
          <Text style={styles.emptyText}>
            Players you've used in past games{"\n"}will appear here.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={recentPlayers as MaybeLoaded<FavoritePlayer>[]}
        keyExtractor={(item) => item.$jazz.id}
        renderItem={renderItem}
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
    paddingBottom: theme.gap(1),
  },
  playerItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  disabledItem: {
    opacity: 0.6,
  },
  iconContainer: {
    width: "10%",
    justifyContent: "center",
    alignItems: "center",
  },
  playerContainer: {
    width: "90%",
    flexDirection: "row",
  },
  playerNameContainer: {
    width: "80%",
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
    width: "20%",
    justifyContent: "center",
  },
  handicap: {
    fontSize: 18,
    textAlign: "right",
  },
  handicapDisabled: {
    color: theme.colors.secondary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
