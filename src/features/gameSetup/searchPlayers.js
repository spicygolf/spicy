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

import { SEARCH_PLAYER_QUERY } from 'features/players/graphql';
import { SEARCH_GHIN_PLAYER_QUERY } from 'features/players/graphql';



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
    this._itemPressed = this._itemPressed.bind(this);
    this._renderPlayer = this._renderPlayer.bind(this);
    this._renderGhinPlayer = this._renderGhinPlayer.bind(this);
  }

  _itemPressed(player) {
    console.log('searchPlayer itemPressed', player);
    Keyboard.dismiss();
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
        onPress={() => this._itemPressed(item)}
      />
    );
  }

  _renderGhinPlayer({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';

    // TODO: handle more than one club
    const club = (item && item.clubs && item.clubs.length ) ?
      `${item.clubs[0].name} - ${item.clubs[0].state}` : '';

    return (
      <ListItem
        title={item.playerName || ''}
        subtitle={`${handicap} - ${club}`}
        onPress={() => this._itemPressed(item)}
      />
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
        >
          {({ loading, error, data }) => {
            if( loading ) return (<ActivityIndicator />);
            if( error ) {
              console.log(error);
              return (<Text>Error</Text>);
            }

            const header = data.searchPlayer.length ?
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

            const header = data.searchGhinPlayer.length ?
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
