import React, { useContext } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';
import { useQuery } from '@apollo/client';

import { GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY } from 'features/players/graphql';

import Player from 'features/gameSetup/Player';
import { GameContext } from 'features/game/gameContext';



const AddPlayerFavorites = props => {

  const { currentPlayerKey, game } = useContext(GameContext);

  const _renderFavoritesPlayer = ({item, index}) => {

    const handicap = (item && item.handicap && item.handicap.index) ?
    item.handicap.index : 'NH';
    const club = (item && item.clubs && item.clubs[0]) ?
    item.clubs[0].name : '';

    return (
      <Player
        game={game}
        item={item}
        title={item.name}
        subtitle={club}
        hdcp={handicap}
        testID={index}
      />
    );
  }

  const { loading, error, data } = useQuery(GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayerKey,
    },
  });

  if( loading ) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  if( error && error.message != 'Network request failed') {
    console.log(error);
    // TODO: error component
    return (<Text>Error Loading Favorite Players: `{error.message}`</Text>);
  }

  //console.log('getFavoritePlayersForPlayer data', currentPlayerKey, data);

  const players = (data && data.getFavoritePlayersForPlayer)
    ? data.getFavoritePlayersForPlayer
    : [];
  const newPlayers = players.map(p => ({
    ...p,
    fave: {
      faved: true,
      from: {type: 'player', value: currentPlayerKey},
      to:   {type: 'player', value: p._key},
      refetchQueries: [{
        query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
        variables: {
          pkey: currentPlayerKey
        }
      }],
      awaitRefetchQueries: true
    }
  }));

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlatList
          data={newPlayers}
          renderItem={_renderFavoritesPlayer}
          keyExtractor={item => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    </View>
  );

};

export default AddPlayerFavorites;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
