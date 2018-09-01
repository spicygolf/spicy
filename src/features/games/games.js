'use strict';

import React from 'react';

import {
  AsyncStorage,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import gql from 'graphql-tag';

import { Actions } from 'react-native-router-flux';

import { List, ListItem } from 'react-native-elements';

import {
  GET_PLAYER_QUERY
} from 'features/players/graphql';
import {
  currentGame,
  ACTIVE_GAMES_FOR_PLAYER_QUERY
} from 'features/games/graphql';

import { blue } from 'common/colors';


class Games extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPlayerKey: null
    };
    this._renderItem = this._renderItem.bind(this);
  }

  _newGamePressed() {
    Actions.newGame();
  }

  _setCurrentGame(game) {
    this.props.client.writeQuery({
      query: currentGame,
      data: {
        currentGame: game
      }
    });
  }

  _itemPressed(item) {
    this._setCurrentGame(item);
    Actions.game({
      game: {
        id    : item._key,
        name  : item.name,
        start : item.start
      }
    });
  }

  _renderItem({item}) {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.start || ''}
        onPress={() => this._itemPressed(item)}
      />
    );
  }

  componentDidMount() {
    const _asyncRequest = AsyncStorage.getItem('currentPlayer')
      .then(data => {
        this.setState(_prev => ({
          currentPlayerKey: data
        }));
      });
  }

  render() {
    const { currentPlayerKey } = this.state;

    if( !currentPlayerKey ) {
      return (
        <Text>Loading...</Text>
      );
    }

    //console.log('games render client', this.props.client.cache._queryable);
    return (
      <Query
        query={ACTIVE_GAMES_FOR_PLAYER_QUERY}
        variables={{pkey: currentPlayerKey}}
        fetchPolicy='cache-and-network'
      >
        {({ data: { activeGamesForPlayer: games }, loading, error}) => {
          if( loading ) return (<Text>Loading...</Text>);

          // TODO: error component instead of below...
          if( error ) {
            console.log(error);
            return (<Text>Error</Text>);
          }

          return (
            <View>
              <View style={styles.gamesSubMenu}>
                <View style={styles.gamesSubMenuSpacer} />
                <View style={styles.newGameButton}>
                  <Button
                    onPress={this._newGamePressed}
                    title="New Game"
                    accessibilityLabel="New Game"
                    color={blue}
                  />
                </View>
              </View>
              <List>
                <FlatList
                  data={games}
                  renderItem={this._renderItem}
                  keyExtractor={item => item._key}
                />
              </List>
            </View>
          );
        }}
      </Query>
    );

  }

}

export default withApollo(Games);


var styles = StyleSheet.create({
  gamesSubMenu: {
    flexDirection: 'row',
    flex: 3,
    minHeight: 25
  },
  gamesSubMenuSpacer: {
    flex: 2
  },
  newGameButton: {
    flex: 1
  }
})
