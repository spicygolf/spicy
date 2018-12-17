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

import { Actions } from 'react-native-router-flux';

import { remove } from 'lodash';


class ItemCard extends React.Component {

  constructor(props) {
    super(props);
    this._addPressed = this._addPressed.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed(key) {
      Actions[key]();
  }

  _itemPressed(item) {
    if( this.props.itemComponent ) {
      Actions[this.props.itemComponent]({item: item});
    }
  }

  _removePressed(item) {
    this.props.removeFn(item);
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item[this.props.itemTitleField] || ''}
        subtitle={item[this.props.itemSubTitleField] ||
          `no ${this.props.itemSubTitleField}`}
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
          title={this.props.addButtonTitle}
          onPress={() => this._addPressed(this.props.addKey)}
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
        <ActivityIndicator />
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
