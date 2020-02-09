import React, { useContext } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View
} from 'react-native';

import {
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  GetFavoritePlayersForPlayer
} from 'features/players/graphql';

import Player from 'features/gameSetup/Player';
import { GameContext } from 'features/game/gameContext';
import { AddPlayerContext } from 'features/gameSetup/addPlayerContext';



const AddPlayerFavorites = props => {

  const { currentPlayerKey } = useContext(GameContext);
  const { team } = useContext(AddPlayerContext);

  const _renderFavoritesPlayer = ({item}) => {

    const handicap = (item && item.handicap && item.handicap.display) ?
    item.handicap.display : 'no handicap';
    const club = (item && item.clubs && item.clubs[0]) ?
    ` - ${item.clubs[0].name}` : '';

    return (
      <Player
        team={team}
        item={item}
        title={item.name}
        subtitle={`${handicap}${club}`}
      />
    );
  }

  // TODO: useQuery
  return (
    <View style={styles.container}>
      <GetFavoritePlayersForPlayer pkey={currentPlayerKey}>
        {({loading, players}) => {
          if( loading ) return (<ActivityIndicator />);
          const newPlayers = players.map(player => ({
            ...player,
            fave: {
              faved: true,
              from: {type: 'player', value: currentPlayerKey},
              to:   {type: 'player', value: player._key},
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
            <View style={styles.listContainer}>
              <FlatList
                data={newPlayers}
                renderItem={_renderFavoritesPlayer}
                keyExtractor={item => item._key}
                keyboardShouldPersistTaps={'handled'}
              />
            </View>
          );
        }}
      </GetFavoritePlayersForPlayer>
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
