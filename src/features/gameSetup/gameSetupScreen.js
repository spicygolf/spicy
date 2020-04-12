import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import Players from 'features/gameSetup/players';
import Teams from 'features/gameSetup/teams';
import Options from 'features/gameSetup/options';
import Admin from 'features/gameSetup/admin';


const GameSetupScreen = props => {

  const { currentPlayer: cp } = useContext(CurrentPlayerContext);

  const admin = (cp && cp.level && cp.level == 'admin' ) ? (<Admin />) : null;

  return (
    <View style={styles.container}>
      <ScrollView>
        <Players addCurrentPlayer={true} />
        <Teams />
        <Options />
        { admin }
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
