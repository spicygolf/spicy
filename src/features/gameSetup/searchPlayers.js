'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import {
  ListItem
} from 'react-native-elements';

import { Query } from 'react-apollo';

import {
  AddPlayerMutation,
  linkGhinPlayer2Player,
  SEARCH_PLAYER_QUERY,
  SEARCH_GHIN_PLAYER_QUERY
} from 'features/players/graphql';
import {
  AddLinkMutation
} from 'common/graphql/link';



const ListHeader = ({title}) => (
  <View>
    <Text style={styles.header}>{title}</Text>
  </View>
);


class SearchPlayers extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      q: ''
    };
    this._playerPressed = this._playerPressed.bind(this);
    this._renderPlayer = this._renderPlayer.bind(this);
    this._renderGhinPlayer = this._renderGhinPlayer.bind(this);
  }

  _playerPressed(player) {
    Keyboard.dismiss();
    this.props.addFn(player._key);
    this.props.navigation.goBack();
  }

  _renderPlayer({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';

    // TODO: handle more than one club
    const club = (item && item.clubs && item.clubs.length ) ?
      `${item.clubs[0].name} - ${item.clubs[0].state}` : '';

    return (
      <ListItem
        title={item.name || ''}
        subtitle={`${handicap} - ${club}`}
        onPress={() => this._playerPressed(item)}
      />
    );
  }

  _renderGhinPlayer({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';

    // TODO: handle more than one club
    const club = (item && item.clubs && item.clubs.length ) ?
      `${item.clubs[0].name} - ${item.clubs[0].state}` : '';

    const gpkey = item._key;
    const clubkey = item.clubs[0]._key;

    const player = {
      email: `@@@_${gpkey}`,
      name: item.playerName,
      short: item.firstName,
      password: `@@@_${gpkey}`
    };

    // this is kind of a nested mess.
    // first, we add a player and get the pkey back from the Mutation
    // then we add two edges (link mutations), one for gp2p and one for p2c
    return (
      <AddPlayerMutation>
        {({addPlayerMutation}) => (
          <AddLinkMutation>
            {({addLinkMutation : gp2p}) => (
              <AddLinkMutation>
                {({addLinkMutation : p2c}) => (
                  <ListItem
                    title={item.playerName || ''}
                    subtitle={`${handicap} - ${club}`}
                    onPress={async () => {
                      const {data, errors} = await addPlayerMutation({
                        variables: {
                          player: player
                        }
                      });
                      if( data && data.addPlayer && data.addPlayer._key &&
                          (!errors || errors.length == 0 ) ) {
                        const pkey = data.addPlayer._key;
                        const gp2p_res = await gp2p({
                          variables: {
                            from: {type: 'ghin_player', value: gpkey},
                            to: {type: 'player', value: pkey}
                          }
                        });
                        console.log('gp2p_res', gp2p_res);
                        const p2c_res = await p2c({
                          variables: {
                            from: {type: 'player', value: pkey},
                            to: {type: 'club', value: clubkey}
                          }
                        });
                        console.log('p2c_res', p2c_res);
                        this._playerPressed({_key: pkey});
                      } else {
                        console.log('addPlayer did not work', errors);
                      }
                    }}
                  />
                )}
              </AddLinkMutation>
            )}
          </AddLinkMutation>
        )}
      </AddPlayerMutation>
    );
  }

  render() {
    const { q } = this.state;

    return (
      <View style={styles.container}>
        <TextInput
          style={styles.searchTextInput}
          placeholder='search players...'
          autoCapitalize='none'
          autoFocus={true}
          onChangeText={text => this.setState({q: text})}
          value={q}
        />
        <View style={styles.searchResultsContainer}>
          <Query
            query={SEARCH_PLAYER_QUERY}
            variables={{q: q}}
          >
            {({ loading, error, data }) => {
              console.log('search typing', q, loading, error, data);
              if( loading ) return (<ActivityIndicator />);
              if( error ) {
                console.log(error);
                return (<Text>Error</Text>);
              }

              const header = (
                  data &&
                  data.searchPlayer &&
                  data.searchPlayer.length) ?
                (<ListHeader title='Registered Players' />) : null;

              return (
                <FlatList
                  data={data.searchPlayer}
                  renderItem={this._renderPlayer}
                  ListHeaderComponent={header}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              );
            }}
          </Query>
          <Query
            query={SEARCH_GHIN_PLAYER_QUERY}
            variables={{q: q}}
          >
            {({ loading, error, data }) => {
              if( loading ) return (<ActivityIndicator />);
              if( error ) {
                console.log(error);
                return (<Text>Error</Text>);
              }

              const header = (
                  data &&
                  data.searchGhinPlayer &&
                  data.searchGhinPlayer.length) ?
                (<ListHeader title='Other Players' />) : null;

              return (
                <FlatList
                  data={data.searchGhinPlayer}
                  renderItem={this._renderGhinPlayer}
                  ListHeaderComponent={header}
                  keyExtractor={item => item._key}
                  keyboardShouldPersistTaps={'handled'}
                />
              );
            }}
          </Query>
        </View>
      </View>
    );
  }
}


export default SearchPlayers;


const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  },
  container: {

  },
  searchTextInput: {
    fontSize: 20,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  searchResultsContainer: {

  },
});
