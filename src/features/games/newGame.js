'use strict';

import React from 'react';

import {
  FlatList,
  Text,
  View
} from 'react-native';

import { List, ListItem } from 'react-native-elements';

import { connect } from 'react-redux';

import { Actions } from 'react-native-router-flux';

import GameNav from 'features/games/gamenav';

import { baseUrl } from 'common/config';
import { selectGameSpecs } from 'features/games/gameSelectors';
import { fetchGameSpecs } from 'features/games/gameActions';
import { selectRoundsPlayers } from 'features/rounds/roundSelectors';


class NewGame extends React.Component {

  componentWillMount() {
    // TODO: send this.props.player to endpoint for tailored game choices
    this.props.fetchGameSpecs();
    this._renderItem = this._renderItem.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
  }

  _itemPressed(item) {
    console.log(item);
    //    this.props.setCurrentGame(item);
    Actions.game_setup({
      game: null,
      gamespec: item
    });
  }

  _renderItem({item}) {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.type || ''}
        onPress={() => this._itemPressed(item)}
      />
    );
  }


  render() {

    var content;

    if( this.props.gamespecs ) {
      content = (
        <View>
          <GameNav
            title='New Game'
            showBack={true}
            showScore={false}
          />
          <List>
            <FlatList
              data={this.props.gamespecs}
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
}

function mapState(state) {
  return {
    gamespecs: selectGameSpecs(state)
  };
}

const actions = {
  fetchGameSpecs: fetchGameSpecs
};

export default connect(mapState, actions)(NewGame);
