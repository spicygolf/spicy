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

import moment from 'moment';

import Players from 'features/gameSetup/players';
import { GameContext } from 'features/game/gameContext';



const GameSetupScreen = props => {

  const { game, gamespec:gs } = useContext(GameContext);
  const start = moment(game.start).format('llll');

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
      <View style={styles.setupContainer}>
        <View style={styles.gname}>
          <Text style={styles.name_txt}>{gs.name} - {start}</Text>
        </View>
        <ScrollView>
          { playerSection }
          { optionsSection }
        </ScrollView>
      </View>
    </View>
  );

};

export default GameSetupScreen;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginBottom: 100
  },
  setupContainer: {
    flex: 12
  },
  gname: {
    alignItems: 'center'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
