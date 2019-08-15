import React from 'react';
import {
  createMaterialTopTabNavigator
} from 'react-navigation';

import Leaderboard from 'features/game/leaderboard';
import Score from 'features/game/score';
import GameSetup from 'features/gameSetup/gameSetup';

import { green } from 'common/colors';



const GameStack = createMaterialTopTabNavigator(
  {
    Leaderboard: Leaderboard,
    Score: Score,
    Setup: GameSetup
  },
  {
    initialRouteName: 'Leaderboard',
    tabBarOptions: {
      upperCaseLabel: false,
      inactiveTintColor: '#ccc',
      inactiveBackgroundColor: '#666',
      activeTintColor: '#fff',
      style: {
        backgroundColor: green
      }
    }
  }
);


export default GameStack;
