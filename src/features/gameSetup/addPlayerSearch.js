import React, { useContext, useRef, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Query } from 'react-apollo';
import { find } from 'lodash';
import { useMutation } from '@apollo/react-hooks';

import {
  ADD_PLAYER_MUTATION,
  SEARCH_GHIN_PLAYER_QUERY,
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  GetFavoritePlayersForPlayer
} from 'features/players/graphql';
import { ADD_LINK_MUTATION } from 'common/graphql/link';
import Player from 'features/gameSetup/Player';
import { GameContext } from 'features/game/gameContext';



const AddPlayerSearch = (props) => {

  const [ search, setSearch ] = useState('');
  const searchInputRef = useRef(null);

  const { currentPlayerKey } = useContext(GameContext);

  const [ addPlayer ] = useMutation(ADD_PLAYER_MUTATION);
  const [ link ] = useMutation(ADD_LINK_MUTATION);

  const addPlayerFromGhinPlayer = gp => {
    if( gp.playerName != 'Eric Froseth' ) return;
    const p = {
      name: gp.playerName,
    };
    const { loading, error, data } = addPlayer({
      variables: {
        player: p,
      },
    });
    if( data && data.addPlayer ) {
      console.log('addPlayer data', data.addPlayer);
      const { gp2pLoading, gp2pError, gp2pData } = link({
        variables: {
          from: {type: 'ghin_player', value: gp._key},
          to: {type: 'player', value: data.addPlayer._key},
        },
      });
    }
  };

  const _renderPlayer = ({item}) => {
    const handicap = (item && item.handicap && item.handicap.handicapIndex) ?
    item.handicap.handicapIndex : 'NH';
    const club = (item && item.clubs && item.clubs[0]) ?
      item.clubs[0].name : '';

    return (
      <Player
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
        <Query
          query={SEARCH_GHIN_PLAYER_QUERY}
          variables={{q: search}}
        >
          {({ loading, error, data }) => {
            if( loading ) return (<ActivityIndicator />);
            if( error ) {
              console.log(error);
              return (<Text>Error</Text>);
            }

            if(
              data &&
              data.searchGhinPlayer &&
              data.searchGhinPlayer.length) {

              //console.log('search players', data.searchGhinPlayer);

              // TODO: useQuery
              return (
                <GetFavoritePlayersForPlayer pkey={currentPlayerKey}>
                  {({loading, players:favePlayers}) => {
                    if( loading ) return (<ActivityIndicator />);
                    let players = data.searchGhinPlayer.map(async gp => {
                      if( !gp.pkey ) await addPlayerFromGhinPlayer(gp);
                      return ({
                        ...gp,
                        name: gp.playerName,
                        fave: {
                          faved: (find(favePlayers, {_key: gp.pkey}) ? true : false),
                          from: {type: 'player', value: currentPlayerKey},
                          to:   {type: 'player', value: gp.pkey},
                          refetchQueries: [{
                            query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
                            variables: {
                              pkey: currentPlayerKey
                            }
                          }]
                        }
                      });
                    });
                    //players = orderBy(players,
                    //              ['gender', 'rating', 'slope'],
                    //              ['desc',   'desc',   'desc' ]);

                    //const header = (<ListHeader title='Registered Players' />);

                    return (
                      <FlatList
                        data={players}
                        renderItem={_renderPlayer}
                        keyExtractor={item => item._key}
                        keyboardShouldPersistTaps={'handled'}
                      />
                    );

                  }}
                </GetFavoritePlayersForPlayer>
              );
            } else {
              return null;
            }
          }}
        </Query>
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
