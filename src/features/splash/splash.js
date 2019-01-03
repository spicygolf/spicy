import React from 'react';

import {
  AsyncStorage,
  StyleSheet,
  Text,
  View
} from 'react-native';



class Splash extends React.Component {

  async componentDidMount() {

    const token = await AsyncStorage.getItem('token');

    // if no token, render Login component
    if( !token ) {
      this.props.navigation.navigate('Auth');
      return;
    }
    // we have token, so render tabs
    this.props.navigation.navigate('App');
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Spicy Golf</Text>
        <Text>Splash Page</Text>
      </View>
    );
  }

}

export default Splash;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
