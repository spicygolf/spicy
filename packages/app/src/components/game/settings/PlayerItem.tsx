import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Golfer } from "@spicygolf/ghin";
import { useAccount } from "jazz-tools/react-native";
import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  Club,
  FavoritePlayer,
  ListOfClubs,
  ListOfFavoritePlayers,
  Player,
  PlayerAccount,
} from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { type PlayerData, useAddPlayerToGame, useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Text } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function PlayerItem({ item }: { item: Golfer }) {
  const navigation = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { ghinId: true } },
    },
  });

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          players: {
            $each: {
              player: true,
            },
          },
        },
      },
    },
  });

  // Check if player is already in the game
  const full_name = [item.first_name, item.middle_name, item.last_name].join(
    " ",
  );

  // Check if player is already in the game
  const isPlayerAlreadyAdded =
    (game?.$isLoaded &&
      game.players?.$isLoaded &&
      game.players.some(
        (player) => player?.$isLoaded && player.ghinId === item.ghin.toString(),
      )) ||
    false;

  // Check if player is in favorites - direct access, no useMemo (Jazz is already reactive)
  const isFavorited = (() => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded ||
      !me.root.favorites.players?.$isLoaded
    ) {
      return false;
    }
    return me.root.favorites.players.some(
      (fav) =>
        fav?.$isLoaded &&
        fav.player?.$isLoaded &&
        fav.player.ghinId === item.ghin.toString(),
    );
  })();

  const handleToggleFavorite = useCallback(
    async (newState: boolean) => {
      if (
        !me?.$isLoaded ||
        !me.root?.$isLoaded ||
        !me.root.favorites?.$isLoaded
      ) {
        return;
      }

      const favorites = me.root.favorites;
      const group = me.root.$jazz.owner;

      if (newState) {
        // Add to favorites
        if (!favorites.$jazz.has("players")) {
          favorites.$jazz.set(
            "players",
            ListOfFavoritePlayers.create([], { owner: group }),
          );
        }
        const playersList = favorites.players;
        if (playersList?.$isLoaded) {
          // Check if already favorited
          const alreadyFavorited = playersList.some(
            (fav) =>
              fav?.$isLoaded &&
              fav.player?.$isLoaded &&
              fav.player.ghinId === item.ghin.toString(),
          );

          if (!alreadyFavorited) {
            // Create club info if available
            let clubs: ListOfClubs | undefined;
            if (item.club_name) {
              const club = Club.create(
                {
                  name: item.club_name,
                  state: item.state || undefined,
                },
                { owner: group },
              );
              clubs = ListOfClubs.create([club], { owner: group });
            }

            // Create a new player entity for the favorite
            const newPlayer = Player.create(
              {
                name: full_name,
                short: item.first_name || "",
                gender: item.gender,
                ghinId: item.ghin.toString(),
                handicap:
                  item.hi_value && typeof item.hi_value === "number"
                    ? {
                        source: "ghin" as const,
                        display: item.hi_display,
                        value: item.hi_value,
                        revDate:
                          item.rev_date instanceof Date
                            ? item.rev_date
                            : undefined,
                      }
                    : undefined,
                clubs,
              },
              { owner: group },
            );

            const favoritePlayer = FavoritePlayer.create(
              {
                player: newPlayer,
                addedAt: new Date(),
              },
              { owner: group },
            );

            playersList.$jazz.push(favoritePlayer);
          }
        }
      } else {
        // Remove from favorites
        if (favorites.players?.$isLoaded) {
          const index = favorites.players.findIndex(
            (fav) =>
              fav?.$isLoaded &&
              fav.player?.$isLoaded &&
              fav.player.ghinId === item.ghin.toString(),
          );
          if (index >= 0) {
            favorites.players.$jazz.splice(index, 1);
          }
        }
      }
    },
    [me, item, full_name],
  );

  // Early return after all hooks
  if (!item || !full_name) {
    return null;
  }

  const keyExtractor = (g: Golfer) => `${g?.ghin}-${g?.club_id}-${full_name}`;
  const key = keyExtractor(item);

  const makePlayer = (): PlayerData => {
    return {
      name: full_name || "",
      short: item.first_name || "",
      gender: item.gender,
      ghinId: item.ghin.toString(),
      handicap: item.ghin
        ? {
            source: "ghin" as const,
            display: item.hi_display,
            value:
              typeof item.hi_value === "number" ? item.hi_value : undefined,
            revDate: item.rev_date instanceof Date ? item.rev_date : undefined,
          }
        : undefined,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.fave_container}>
        <FavoriteButton
          isFavorited={isFavorited}
          onToggle={handleToggleFavorite}
          size={24}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.player_container,
          isPlayerAlreadyAdded && styles.player_container_disabled,
        ]}
        key={key}
        disabled={isPlayerAlreadyAdded}
        onPress={async () => {
          if (!isPlayerAlreadyAdded) {
            const result = await addPlayerToGame(makePlayer());
            if (result.isOk()) {
              const { player, roundAutoCreated } = result.value;
              if (roundAutoCreated) {
                // Round was auto-created, go back to player list.
                // Uses goBack() because this screen is nested inside AddPlayerNavigator.
                navigation.goBack();
              } else {
                // Need to select or create a round
                navigation.navigate("AddRoundToGame", {
                  playerId: player.$jazz.id,
                });
              }
            } else {
              const error = result.error;
              // TODO error component
              console.error(error);
            }
          }
        }}
      >
        <View style={styles.player_name_container}>
          <Text
            style={[
              styles.player_name,
              isPlayerAlreadyAdded && styles.player_name_disabled,
            ]}
          >
            {full_name}
            {isPlayerAlreadyAdded && " ✓"}
          </Text>
          <Text
            style={[
              styles.player_club,
              isPlayerAlreadyAdded && styles.player_club_disabled,
            ]}
          >
            {item.club_name}
            {item.state ? `, ${item.state}` : ""}
          </Text>
        </View>
        <View style={styles.handicap_container}>
          <Text
            style={[
              styles.handicap,
              isPlayerAlreadyAdded && styles.handicap_disabled,
            ]}
          >
            {item.hi_display}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.gap(1),
  },
  fave_container: {
    width: "10%",
    justifyContent: "center",
  },
  player_container: {
    width: "90%",
    flexDirection: "row",
  },
  player_name_container: {
    width: "80%",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  player_name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  player_club: {
    fontSize: 11,
    fontStyle: "italic",
  },
  handicap_container: {
    width: "20%",
    justifyContent: "center",
  },
  handicap: {
    fontSize: 18,
    textAlign: "right",
  },
  player_container_disabled: {
    opacity: 0.6,
  },
  player_name_disabled: {
    color: theme.colors.secondary,
  },
  player_club_disabled: {
    color: theme.colors.secondary,
    fontStyle: "italic",
  },
  handicap_disabled: {
    color: theme.colors.secondary,
  },
}));
