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

import { connect } from 'react-redux';

import { Actions } from 'react-native-router-flux';

import { List, ListItem } from 'react-native-elements';

import {
  fetchActiveGames,
  setCurrentGame
} from 'features/games/gameActions';
import { selectGames } from 'features/games/gameSelectors';

import { blue } from 'common/colors';


class Games extends React.Component {

  constructor(props) {
    super(props);
    this._renderItem = this._renderItem.bind(this);
  }

  _newGamePressed() {
    Actions.newGame();
  }

  _itemPressed(item) {
    this.props.setCurrentGame(item);
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
        subtitle={item.gametype + ' - ' + item.start || ''}
        onPress={() => this._itemPressed(item)}
      />
    );
  }

  render() {
    var content;

    if( this.props && this.props.games ) {
      content = (
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
              data={this.props.games}
              renderItem={this._renderItem}
              keyExtractor={item => item._key}
            />
          </List>
        </View>
      );
    } else {
      content = (
        <Text>Loading...</Text>
      );
    }

    return (
      <View>
        {content}
      </View>
    );
  }
};


function mapState(state) {
  return {
    games: selectGames(state)
  };
}

const actions = {
  fetchActiveGames,
  setCurrentGame
};

export default connect(mapState, actions)(Games);

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
