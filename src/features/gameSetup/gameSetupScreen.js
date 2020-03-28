import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';

import Players from 'features/gameSetup/players';
import Teams from 'features/gameSetup/teams';
import Options from 'features/gameSetup/options';



const GameSetupScreen = props => {

  return (
    <View style={styles.container}>
      <ScrollView>
        <Players addCurrentPlayer={true} />
        <Teams />
        <Options />
      </ScrollView>
    </View>
  );

};

export default GameSetupScreen;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 10,
  },
});
