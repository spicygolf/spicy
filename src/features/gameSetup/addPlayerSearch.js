import React, { useContext, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { Query } from 'react-apollo';

import { find } from 'lodash';

import {
  SEARCH_PLAYER_QUERY,
  GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
  GetFavoritePlayersForPlayer
} from 'features/players/graphql';

import Player from 'features/gameSetup/Player';
import { GameContext } from 'features/game/gamecontext';
import { AddPlayerContext } from 'features/gameSetup/addPlayerContext';



const AddPlayerSearch = (props) => {

  const [ search, setSearch ] = useState('');
  let searchInput;

  const { game, currentPlayerKey } = useContext(GameContext);
  const { team } = useContext(AddPlayerContext);

  const ListHeader = ({title}) => (
    <View>
      <Text style={styles.header}>{title}</Text>
    </View>
  );

  const _renderPlayer = ({item}) => {
    const handicap = (item && item.handicap && item.handicap.display) ?
    item.handicap.display : 'no handicap';
    const club = (item && item.clubs && item.clubs[0]) ?
    ` - ${item.clubs[0].name}` : '';

    return (
      <Player
        game={game}
        team={team}
        item={item}
        title={item.name}
        subtitle={`${handicap}${club}`}
      />
    );
  }
/*
  componentDidMount() {
    this.didFocusListener = this.props.navigation.addListener('didFocus', () => {
      if( this.searchInput ) {
        this.searchInput.focus();
      }
    });
  }

  componentWillUnmount() {
    this.didFocusListener.remove();
  }
*/

  return (
    <View style={styles.container}>
      <TextInput
        ref={(input) => { searchInput = input; }}
        style={styles.searchTextInput}
        placeholder='search players...'
        autoCapitalize='none'
        onChangeText={text => setSearch(text)}
        value={search}
      />
      <View>
        <Query
          query={SEARCH_PLAYER_QUERY}
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
              data.searchPlayer &&
              data.searchPlayer.length) {
              return (
                <GetFavoritePlayersForPlayer pkey={currentPlayerKey}>
                  {({loading, players:favePlayers}) => {
                    if( loading ) return (<ActivityIndicator />);
                    let players = data.searchPlayer.map(player => ({
                      ...player,
                      fave: {
                        faved: (find(favePlayers, {_key: player._key}) ? true : false),
                        from: {type: 'player', value: currentPlayerKey},
                        to:   {type: 'player', value: player._key},
                        refetchQueries: [{
                          query: GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY,
                          variables: {
                            pkey: currentPlayerKey
                          }
                        }]
                      }
                    }));
                    //players = orderBy(players,
                    //              ['gender', 'rating', 'slope'],
                    //              ['desc',   'desc',   'desc' ]);

                    const header = (<ListHeader title='Registered Players' />);

                    return (
                      <FlatList
                        data={players}
                        renderItem={_renderPlayer}
                        ListHeaderComponent={header}
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
