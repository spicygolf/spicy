import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';


class AddCourse extends React.Component {

  render() {
    return (
      <View>
        <GameNav
          title='Add Course'
          showBack={true}
          navigation={this.props.navigation}
        />
        <Text>add course</Text>
      </View>
    );
  }

}

export default AddCourse;
