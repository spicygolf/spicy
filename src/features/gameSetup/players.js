'use strict';

import React from 'react';

import {
  ActivityIndicator,
  AsyncStorage,
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

import { GetPlayer } from 'features/players/graphql';



class Players extends React.Component {

  constructor(props) {
    super(props);
    this._addPressed = this._addPressed.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed() {
    this.props.navigation.navigate('add_player', {
      addFn: this.props.addFn
    });
  }

  _itemPressed(player) {
    this.props.navigation.navigate('player_item', {player: player});
  }

  _removePressed(item) {
    this.props.removeFn(item);
  }

  _renderItem({item}) {
    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';

    return (
      <ListItem
        key={item._key}
        title={item.name || ''}
        subtitle={handicap}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPress={() => this._itemPressed(item)}
        onPressRightIcon={() => this._removePressed(item._key)}
      />
    );
  }

  render() {

    if( !this.props.players ) return (<ActivityIndicator />);

    const addButton = ( this.props.showButton ) ?
      (
        <Button
          title='Add Player'
          onPress={() => this._addPressed()}
          testID='add_player_button'
        />
      ) : null;

    console.log('render players', this.props.players);
    const playersList = this.props.players.map(pkey => (
      <GetPlayer
        pkey={pkey}
        key={pkey}
      >
        {({ loading, player }) => {
          if( loading ) return null;
          return this._renderItem({item: player});
        }}
      </GetPlayer>
    ));

    console.log('playersList', playersList);

    return (
      <Card title='Players'>
        <List containerStyle={styles.listContainer}>
          {playersList}
        </List>
        { addButton }
      </Card>
    );
  }
}

export default Players;


const styles = StyleSheet.create({
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
