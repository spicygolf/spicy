import React from 'react';
import {
  createMaterialTopTabNavigator
} from '@react-navigation/material-top-tabs';

import Leaderboard from 'features/game/leaderboard';
import Score from 'features/game/score';
import GameSetup from 'features/gameSetup/gameSetup';

import { green } from 'common/colors';



const GameStack = props => {

  const Tab = createMaterialTopTabNavigator();

  return (
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
        component={GameSetup}
        options={{
          title: 'Setup'
        }}
      />
    </Tab.Navigator>
  );

};

export default GameStack;
