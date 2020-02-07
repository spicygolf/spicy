import React, { useEffect } from 'react';

import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';


const Splash = props => {

  useEffect(
    () => {

      const getCurrentPlayerData = async () => {
        const currentPlayerKey = await AsyncStorage.getItem('currentPlayer');
        const token = await AsyncStorage.getItem('token');

        const currentPlayerData = {
          currentPlayerKey: currentPlayerKey,
          token: token,
        };

        if( token ) {
          // we have token, so render tabs
          props.navigation.navigate('AppStack', currentPlayerData);
        } else {
          // if no token, render Login component
          props.navigation.navigate('AuthStack');
        }


      };
      getCurrentPlayerData();
    }, []
  );

  return (
    <View style={styles.container}>
      <Text>Spicy Golf</Text>
      <Text>Splash Page</Text>
    </View>
  );

};

export default Splash;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
