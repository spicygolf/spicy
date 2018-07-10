'use strict';

import React from 'react';

import {
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
  currentPlayer
} from 'features/players/graphql';
import {
  currentGame,
  activeGamesForPlayer
} from 'features/games/graphql';

import { blue } from 'common/colors';


class Games extends React.Component {

  constructor(props) {
    super(props);
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

  componentWillMount() {
    const rq = this.props.client.readQuery({
      query: currentPlayer
    });
    this.currentPlayer = rq.currentPlayer;
  }

  render() {
    return (
      <Query
        query={activeGamesForPlayer}
        variables={{pkey: this.currentPlayer}}>
        {({data, loading, error}) => {
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
                  data={data.activeGamesForPlayer}
                  renderItem={this._renderItem}
                  keyExtractor={item => item._key}
                />
              </List>
            </View>
          )
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
