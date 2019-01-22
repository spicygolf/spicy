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

import { find, remove } from 'lodash';

import { GetCourse } from 'features/courses/graphql';

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
    this.props.navigation.navigate('add_course', {
      addFn: this.props.addFn
    });
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
        subtitle={item.tee.name ||
          'no Tee selected'}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPress={() => this._itemPressed(item)}
        onPressRightIcon={() => this._removePressed(item)}
      />
    );
  }

  render() {

    const addButton = ( this.props.showButton ) ?
      (
        <Icon
          name='add-circle'
          color={blue}
          size={40}
          title='Add Course,Tees'
          onPress={() => this._addPressed()}
          testID='add_course_button'
        />
      ) : (<Icon name='add-circle' size={40} color='#fff'/>);

    let courseList = null;
    if( this.props.course ) {
      const c = this.props.course;
      courseList = (
        <GetCourse
          courseKey={c.courseKey}
          key={c.courseKey}
        >
          {({ loading, course }) => {
            if( loading ) return null;
            const tee = find(course.tees, ['_key', c.tkey]);
            let newCourse = {...course, tee: tee};
            return this._renderItem({item: newCourse});
          }}
        </GetCourse>
      );
    }

    return (
      <Card>
        <View style={styles.cardTitle}>
          <Icon name='add-circle' size={40} color='#fff'/>
          <Text style={styles.title}>Course, Tees</Text>
          { addButton }
        </View>
        <List containerStyle={styles.listContainer}>
          {courseList}
        </List>
      </Card>
    );
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
