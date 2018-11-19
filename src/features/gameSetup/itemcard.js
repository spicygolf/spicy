'use strict';

import React from 'react';

import {
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


class ItemCard extends React.Component {

  constructor(props) {
    super(props);
    this._addPressed = this._addPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed() {
    console.log('add pressed');
  }

  _removePressed(item) {
    console.log('remove pressed');
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item[this.props.itemTitleField] || ''}
        subtitle={item[this.props.itemSubtitleField] || ''}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPressRightIcon={() => this._removePressed(item)}
      />
    );
  }

  render() {

    let content;
    const addButton = ( this.props.showButton ) ?
      (
        <Button
          title={this.props.buttonTitle}
          onPress={() => this._addPressed()}
        />
      ) : null;

    if( this.props.items ) {

      content = (
        <Card title={this.props.title}>
          <List containerStyle={styles.listContainer}>
            <FlatList
              data={this.props.items}
              renderItem={this._renderItem}
              keyExtractor={item => item._key}
            />
          </List>
          { addButton }
        </Card>
      );

    } else {
      content = (
        <Text>Loading...</Text>
      );
    }

    return content;

  }
}

export default ItemCard;


const styles = StyleSheet.create({
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
