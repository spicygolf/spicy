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



const GameSetupScreen = props => {

  return (
    <View style={styles.container}>
      <ScrollView>
        <Players addCurrentPlayer={true} />
        <Teams />
        <Card title="Options"></Card>
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
