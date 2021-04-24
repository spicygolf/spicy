import React, { useContext, useEffect, useState, } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ListItem,
} from 'react-native-elements';
import { useQuery } from '@apollo/client';
import { find } from 'lodash';

import {
  SEARCH_PLAYER_QUERY,
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
} from 'features/players/graphql';
import { GameContext } from 'features/game/gameContext';
import { SpicyPlayerSearchContext } from 'common/components/spicy/player/searchContext';
import Player from 'features/gameSetup/Player';



const SpicyPlayerSearchResults = props => {

  const { state, setState, onPress } = useContext(SpicyPlayerSearchContext);
  //console.log('spicy player search results context', state);


  const handicap = h => (
    <View>
      <Text style={styles.handicap}>{h}</Text>
    </View>
  );

  const renderGolfer = ({item}) => {
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
        onPress={onPress}
      />
    );
  }
/*
  const _renderGolfer = ({item}) => {
    console.log('golfer', item);
    const fn = item.FirstName ? item.FirstName : item.first_name;
    const ln = item.LastName ? item.LastName : item.last_name;
    const gn = item.GHINNumber ? item.GHINNumber : item.ghin;
    const key = item.GHINNumber ? item.SearchValue :
      `${item.ghin}_${item.club_id}`;
    const player_name = item.PlayerName ? item.PlayerName :
      `${item.first_name} ${item.last_name}`;
    const player_club = item.ClubName ? item.ClubName : item.club_name;
    const hdcp = item.Display ? item.Display : item.handicap_index;
    const revDate = item.RevDate ? item.RevDate : item.rev_date;
    const gender = item.Gender ? item.Gender : item.gender;
    const active = item.Status ? (item.Status == 'Active') : (item.status == 'Active');

    return (
      <ListItem
        containerStyle={styles.container}
        key={key}
        onPress={() => {
          setState({
            ...state,
            ghinCreds: {
              lastName: ln,
              ghinNumber: gn,
            },
            handicap: {
              source: 'ghin',
              id: gn,
              firstName: fn,
              lastName: ln,
              gender,
              playerName: player_name,
              active,
              index: hdcp,
              revDate: revDate,
            },
            name: player_name,
            short: fn,
            club: player_club,
          });
        }}
      >
        <ListItem.Content style={styles.container}>
          <ListItem.Title style={styles.player_name}>{player_name}</ListItem.Title>
          <ListItem.Subtitle style={styles.player_club}>{player_club}</ListItem.Subtitle>
        </ListItem.Content>
        { handicap(hdcp) }
      </ListItem>
    );
  };
*/

  const { currentPlayerKey, game } = useContext(GameContext);

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
      q: state.search,
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
    <FlatList
      data={players}
      renderItem={renderGolfer}
      style={styles.results_list}
      keyExtractor={g => g._key}
      keyboardShouldPersistTaps='handled'
      ListEmptyComponent={(
        <View style={{flex: 1}}>
          <Text style={styles.no_results}>No Results</Text>
        </View>
      )}
    />
  );

};

export default SpicyPlayerSearchResults;


const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 0,
  },
  player_club: {
    color: '#999',
    fontSize: 12,
  },
  handicap: {
    fontSize: 24,
  },
  results_list: {
  },
  no_results: {
    color: "#999",
    alignSelf: 'center',
    fontSize: 20,
  },
});
