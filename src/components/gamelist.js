'use strict';

import React from 'react';

import {
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  Actions
} from 'react-native-router-flux';

import { List, ListItem } from 'react-native-elements';

import { baseUrl } from '../lib/config';

const url = baseUrl + "/player/anderson/games";

class GameList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      games: []
    };
  }

  async _fetchData() {
    try {
      let response = await fetch(url);
      let responseJson = await response.json();
      this._updateData(responseJson);
    } catch(error) {
      console.error(error);
    }
  }

  _updateData(data) {
    this.setState((prevState, props) => {
      prevState.data = data;
      return prevState;
    });
  }

  _renderItem({item}) {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.gametype + ' - ' + item.start || ''}
        onPress={() => Actions.game({
            game: {
              id    : item._key,
              name  : item.name,
              start : item.start
            }
          })}
      />
    );
  }

  componentWillMount() {
    this._fetchData();
  }

  render() {
    var content;

    if( this.state && this.state.data ) {
      content = (
        <List>
          <FlatList
            data={this.state.data}
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

export default GameList;
