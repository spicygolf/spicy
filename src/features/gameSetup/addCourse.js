import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';
import SearchCourses from 'features/gameSetup/searchCourses'


class AddCourse extends React.Component {

  render() {
    return (
      <View>
        <GameNav
          title='Add Course, Tees'
          showBack={true}
          navigation={this.props.navigation}
        />
        <SearchCourses
          addFn={this.props.navigation.getParam('addFn')}
          navigation={this.props.navigation}
        />
      </View>
    );
  }

}

export default AddCourse;
