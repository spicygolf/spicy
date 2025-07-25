import { useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { GameContext } from 'features/game/gameContext';
import Player from 'features/gameSetup/Player';
import { GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY } from 'features/players/graphql';
import React, { useContext } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

const AddPlayerFavorites = (props) => {
  const navigation = useNavigation();
  const { currentPlayerKey, game } = useContext(GameContext);

  const _renderFavoritesPlayer = ({ item, index }) => {
    const handicap =
      item && item.handicap && item.handicap.index ? item.handicap.index : 'NH';
    const clubs = item?.handicap?.clubs?.map((c) => c.name).join(', ');

    return (
      <Player
        game={game}
        item={item}
        title={item.name}
        subtitle={clubs}
        hdcp={handicap}
        onPress={(lItem) => {
          //console.log('player pressed', item);
          const player = {
            _key: lItem._key,
            name: lItem.name,
            handicap: { index: lItem?.handicap?.index },
          };
          navigation.navigate('LinkRoundList', { game, player });
        }}
        testID={index}
      />
    );
  };

  const { loading, error, data } = useQuery(GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && error.message !== 'Network request failed') {
    console.log(error);
    // TODO: error component
    return <Text>Error Loading Favorite Players: `{error.message}`</Text>;
  }

  const players = data?.getFavoritePlayersForPlayer || [];
  const newPlayers = players.map((p) => ({
    ...p,
    fave: {
      faved: true,
      from: { type: 'player', value: currentPlayerKey },
      to: { type: 'player', value: p._key },
      refetchQueries: [
        {
          query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
          variables: {
            pkey: currentPlayerKey,
          },
        },
      ],
      awaitRefetchQueries: true,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={newPlayers}
          renderItem={_renderFavoritesPlayer}
          keyExtractor={(item) => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    </View>
  );
};

export default AddPlayerFavorites;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
});
