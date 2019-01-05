'use strict';

import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Button,
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { remove } from 'lodash';


class Players extends React.Component {

  constructor(props) {
    super(props);
    this._addPressed = this._addPressed.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed() {
    this.props.navigation.navigate('add_player');
  }

  _itemPressed(player) {
    this.props.navigation.navigate('player_item', {player: player});
  }

  _removePressed(item) {
    this.props.removeFn(item);
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={item.handicap ||
          `no handicap`}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPress={() => this._itemPressed(item)}
        onPressRightIcon={() => this._removePressed(item)}
      />
    );
  }

  render() {

    let content;
    const addButton = ( this.props.showButton ) ?
      (
        <Button
          title='Add Player'
          onPress={() => this._addPressed()}
        />
      ) : null;

    if( this.props.players ) {

      content = (
        <Card title={this.props.title}>
          <List containerStyle={styles.listContainer}>
            <FlatList
              data={this.props.players}
              renderItem={this._renderItem}
              keyExtractor={item => item._key}
            />
          </List>
          { addButton }
        </Card>
      );

    } else {
      content = (
        <ActivityIndicator />
      );
    }

    return content;

  }
}

export default Players;


const styles = StyleSheet.create({
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
