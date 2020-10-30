import React, { useContext, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { find } from 'lodash';

import {
  SEARCH_PLAYER_QUERY,
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
} from 'features/players/graphql';
import Player from 'features/gameSetup/Player';
import { GameContext } from 'features/game/gameContext';



const AddPlayerSearch = (props) => {

  const [ search, setSearch ] = useState('');
  const searchInputRef = useRef(null);

  const { currentPlayerKey, game } = useContext(GameContext);

  const _renderPlayer = ({item}) => {
    const handicap = (item && item.handicap && item.handicap.index) ?
    item.handicap.index : 'NH';
    const club = (item && item.clubs && item.clubs[0])
      ? item.clubs[0].name
      : '';

    return (
      <Player
        game={game}
        item={item}
        title={item.name}
        subtitle={club}
        hdcp={handicap}
      />
    );
  }

  useFocusEffect(
    React.useCallback(() => {
      if( searchInputRef && searchInputRef.current ) {
        searchInputRef.current.focus();
      }
    })
  );

  // get this player's favorite players
  const { data: fData } = useQuery(
    GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
    {
      variables: {
        pkey: currentPlayerKey,
      },
    }
  );
  const favorites = ( fData && fData.getFavoritePlayersForPlayer )
    ? fData.getFavoritePlayersForPlayer
    : [];

  // load search term results
  const { data } = useQuery(SEARCH_PLAYER_QUERY, {
    variables: {
      q: search,
    },
    fetchPolicy: 'no-cache',
  });
  const searchPlayers = ( data && data.searchPlayer && data.searchPlayer.length )
    ? data.searchPlayer
    : [];

  // build players array for render
  let players = [];
  if( searchPlayers.length && favorites.length ) {
    players = searchPlayers.map(p => ({
      ...p,
      fave: {
        faved: (find(favorites, {_key: p._key}) ? true : false),
        from: {type: 'player', value: currentPlayerKey},
        to:   {type: 'player', value: p._key},
        refetchQueries: [{
          query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
          variables: {
            pkey: currentPlayerKey
          }
        }]
      }
    }));
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={searchInputRef}
        style={styles.searchTextInput}
        placeholder='search players...'
        autoCapitalize='none'
        onChangeText={text => setSearch(text)}
        value={search}
      />
      <View>
        <FlatList
          data={players}
          renderItem={_renderPlayer}
          keyExtractor={item => item._key}
          keyboardShouldPersistTaps={'handled'}
        />
      </View>
    </View>
  );

};


export default AddPlayerSearch;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15
  },
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  searchTextInput: {
    fontSize: 20,
    color: '#000',
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555'
  },
  citystate: {
    fontSize: 12,
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 50
  }
});
