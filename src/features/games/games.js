'use strict';

import React from 'react';

import {
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { connect } from 'react-redux';

import {
  Actions
} from 'react-native-router-flux';

import { List, ListItem } from 'react-native-elements';

import {
  fetchActiveGames,
  setCurrentGame
} from 'features/games/gameActions';
import { selectGames } from 'features/games/gameSelectors';


class Games extends React.Component {

  constructor(props) {
    super(props);
    this._renderItem = this._renderItem.bind(this);
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

  componentWillMount() {
    this.props.fetchActiveGames('anderson');
  }

  render() {
    var content;

    if( this.props && this.props.games ) {
      content = (
        <List>
          <FlatList
            data={this.props.games}
            renderItem={this._renderItem}
            keyExtractor={item => item._key}
          />
        </List>
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
