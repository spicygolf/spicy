import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';

import Players from 'features/gameSetup/players';
import { GameContext } from 'features/game/gameContext';



const GameSetupScreen = props => {

  const { game, gamespec:gs } = useContext(GameContext);

  const playerSection = (
    <Players
      addCurrentPlayer={true}
    />
  );

  const optionsSection = (
    <Card title="Options">
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        { playerSection }
        { optionsSection }
      </ScrollView>
    </View>
  );

};

export default GameSetupScreen;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginBottom: 100
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
