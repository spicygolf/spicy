import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import SearchCourses from 'features/gameSetup/searchCourses'


class AddCourseSearch extends React.Component {

  render() {
    return (
      <SearchCourses
        addFn={this.props.navigation.getParam('addFn')}
        navigation={this.props.navigation}
      />
    );
  }

}

export default AddCourseSearch;
