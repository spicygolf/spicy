import { useQuery } from "@apollo/client";
import { SpicyPlayerSearchContext } from "common/components/spicy/player/searchContext";
import { GameContext } from "features/game/gameContext";
import Player from "features/gameSetup/Player";
import { CurrentPlayerContext } from "features/players/currentPlayerContext";
import {
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  SEARCH_PLAYER_QUERY,
} from "features/players/graphql";
import { find } from "lodash";
import { useContext } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

const SpicyPlayerSearchResults = () => {
  const { state, onPress } = useContext(SpicyPlayerSearchContext);
  // console.log('spicy player search results context', state);

  const renderGolfer = ({ item }) => {
    const handicap = item?.handicap?.index ? item.handicap.index : "NH";
    const clubs = item?.handicap?.clubs?.map((c) => c.name).join(", ");

    return (
      <Player
        game={game}
        item={item}
        title={item.name}
        subtitle={clubs}
        hdcp={handicap}
        onPress={onPress}
      />
    );
  };

  const { currentPlayer } = useContext(CurrentPlayerContext);
  const gameCtx = useContext(GameContext);
  const game = gameCtx?.game ? gameCtx.game : null;

  // get this player's favorite players
  const { data: fData } = useQuery(GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayer._key,
    },
  });
  const favorites = fData?.getFavoritePlayersForPlayer
    ? fData.getFavoritePlayersForPlayer
    : [];

  // load search term results
  const { data } = useQuery(SEARCH_PLAYER_QUERY, {
    variables: {
      q: state.search,
    },
    fetchPolicy: "no-cache",
  });
  const searchPlayers = data?.searchPlayer?.length ? data.searchPlayer : [];

  // build players array for render
  let players = [];
  if (searchPlayers.length && favorites) {
    players = searchPlayers.map((p) => ({
      ...p,
      fave: {
        faved: !!find(favorites, { _key: p._key }),
        from: { type: "player", value: currentPlayer._key },
        to: { type: "player", value: p._key },
        refetchQueries: [
          {
            query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
            variables: {
              pkey: currentPlayer._key,
            },
          },
        ],
      },
    }));
  }

  return (
    <FlatList
      data={players}
      renderItem={renderGolfer}
      style={styles.results_list}
      keyExtractor={(g) => g._key}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.no_results}>No Results</Text>
        </View>
      }
    />
  );
};

export default SpicyPlayerSearchResults;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emptyContainer: {
    flex: 1,
  },
  handicap: {
    fontSize: 24,
  },
  no_results: {
    alignSelf: "center",
    color: "#999",
    fontSize: 20,
  },
  player_club: {
    color: "#999",
    fontSize: 12,
  },
  results_list: {},
});
