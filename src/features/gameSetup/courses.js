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
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { remove } from 'lodash';

import { blue } from 'common/colors';



class Courses extends React.Component {

  constructor(props) {
    super(props);
    this._addPressed = this._addPressed.bind(this);
    this._itemPressed = this._itemPressed.bind(this);
    this._removePressed = this._removePressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addPressed() {
    this.props.navigation.navigate('add_course');
  }

  _itemPressed(course) {
    this.props.navigation.navigate('course_tee_item', {course: course});
  }

  _removePressed(course) {
    this.props.removeFn(course);
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={item.tee ||
          'no Tee selected'}
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
        <Icon
          name='add-circle'
          color={blue}
          size={40}
          iconStyle={styles.addIcon}
          onPress={() => this._addPressed()}
          testID='add_course_button'
        />
      ) : (<Icon name='add-circle' size={40} color='#fff'/>);

    if( this.props.courses ) {

      content = (
        <Card>
          <View style={styles.cardTitle}>
            <Icon name='add-circle' size={40} color='#fff'/>
            <Text style={styles.title}>Course, Tees</Text>
            { addButton }
          </View>
          <List containerStyle={styles.listContainer}>
            <FlatList
              data={this.props.courses}
              renderItem={this._renderItem}
              keyExtractor={item => item._key}
            />
          </List>
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

export default Courses;


const styles = StyleSheet.create({
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  },
});
