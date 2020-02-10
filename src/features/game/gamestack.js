import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  createMaterialTopTabNavigator
} from '@react-navigation/material-top-tabs';
import moment from 'moment';

import { GameContext } from 'features/game/gameContext';
import Leaderboard from 'features/game/leaderboard';
import Score from 'features/game/score';
import GameSetupStack from 'features/gameSetup/gameSetupStack';

import { green } from 'common/colors';



const GameStack = props => {

  const { game, gamespec } = useContext(GameContext);
  const start = moment(game.start).format('llll');

  const Tab = createMaterialTopTabNavigator();

  return (
    <View style={styles.container}>
      <View style={styles.gname}>
        <Text style={styles.name_txt}>{gamespec.name} - {start}</Text>
      </View>
      <Tab.Navigator
        initialRouteName='Score'
        screenOptions={{
          inactiveTintColor: '#ccc',
          inactiveBackgroundColor: '#666',
          activeTintColor: '#fff',
          style: {
            backgroundColor: green
          },
        }}
        tabBarOptions={{
          labelStyle: {
            textTransform: 'capitalize',
          }
        }}
      >
        <Tab.Screen
          name='Leaderboard'
          component={Leaderboard}
          options={{
            title: 'Leaderboard'
          }}
        />
        <Tab.Screen
          name='Score'
          component={Score}
          options={{
            title: 'Score'
          }}
        />
        <Tab.Screen
          name='GameSetup'
          component={GameSetupStack}
          options={{
            title: 'Setup'
          }}
        />
      </Tab.Navigator>
    </View>
  );

};

export default GameStack;

const styles = StyleSheet.create({
  container: {
    flex: 12
  },
  gname: {
    alignItems: 'center'
  },
})