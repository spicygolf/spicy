'use strict';

import React from 'react';

import {
  ActivityIndicator,
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

import { List, ListItem } from 'react-native-elements';

import {
  CURRENT_GAME_QUERY,
  ACTIVE_GAMES_FOR_PLAYER_QUERY
} from 'features/games/graphql';

import { blue } from 'common/colors';


class Games extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPlayerKey: null
    };
    this._newGamePressed = this._newGamePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _newGamePressed() {
    this.props.navigation.navigate(
      'NewGame',
      {currentPlayerKey: this.state.currentPlayerKey}
    );
  }

  _setCurrentGame(game) {
    this.props.client.writeQuery({
      query: CURRENT_GAME_QUERY,
      data: {
        currentGame: game
      }
    });
  }

  _itemPressed(item) {
    this._setCurrentGame(item);
    this.props.navigation.navigate('Game');
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

  async componentDidMount() {
    const data = await AsyncStorage.getItem('currentPlayer');
    this.setState({
      currentPlayerKey: data
    });
  }

  render() {
    const { currentPlayerKey } = this.state;

    if( !currentPlayerKey ) {
      return (
        <ActivityIndicator />
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
          if( loading ) return (<ActivityIndicator />);

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
                    testID='new_game'
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
