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

/*
  async _ghinPlayerPressed(gp) {
    // ghin player clicked, so make a new ghost player
    const pkey = await addPlayer();
    // link ghost player to ghin player clicked
    await linkGhinPlayer2Player(gp._key, pkey);
    // then act like the ghost player was clicked and add them to game
    this._playerPressed({_key: pkey});
  }
*/

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

    const player = {
      email: '*****',
      name: item.playerName,
      short: item.firstName,
      password: '*****'
    };

    return (
      <AddPlayerMutation player={player}>
        {addPlayerMutation => {
          console.log('addPlayerMutation in searchPlayers', addPlayerMutation);
          return (
            <ListItem
              title={item.playerName || ''}
              subtitle={`${handicap} - ${club}`}
              onPress={() => {addPlayerMutation}}
            />
          );
        }}
      </AddPlayerMutation>
    );
  }

  render() {
    const { q } = this.state;

    return (
      <View>
        <TextInput
          style={styles.searchTextInput}
          placeholder='search players...'
          autoCapitalize='none'
          autoFocus={true}
          onChangeText={text => this.setState({q: text})}
          value={q}
        />
        <Query
          query={SEARCH_PLAYER_QUERY}
          variables={{q: q}}
          fetchPolicy='no-cache'
        >
          {({ loading, error, data }) => {
            console.log(q, loading, error, data);
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
          fetchPolicy='no-cache'
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
    );
  }
}


export default SearchPlayers;


const styles = StyleSheet.create({
  searchTextInput: {
    fontSize: 20,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20
  },
  header: {
    paddingTop: 10,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: 'bold'
  }
});
