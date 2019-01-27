import React from 'react';

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';



class AddCourseFavorites extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <Text>Add Course from Favorites</Text>
      </View>
    );
  }

}

export default AddCourseFavorites;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
