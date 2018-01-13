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


class GameList extends React.Component {

  constructor(props) {
    super(props);
    this._renderItem = this._renderItem.bind(this);
  }

  _renderItem({item}) {
    return (
      <ListItem
        roundAvatar
        title={item.name || ''}
        subtitle={item.gametype + ' - ' + item.start || ''}
        onPress={() => Actions.game({
            ...this.props,
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
    this.props.fetchActiveGames();
  }

  render() {
    var content;

    if( this.props.activeGames ) {
      content = (
        <List>
          <FlatList
            data={this.props.activeGames}
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


function mapStateToProps(state) {
  return {
    activeGames: state.activeGames
  };
}

export default connect(mapStateToProps)(GameList);
