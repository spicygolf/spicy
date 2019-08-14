import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import Leaderboard from 'features/game/leaderboard';
import Score from 'features/game/score';
import GameSetup from 'features/gameSetup/gameSetup';


import { green } from 'common/colors';


const GameStack = createStackNavigator(
  {
    Leaderboard: Leaderboard,
    Score: Score,
    Setup: GameSetup
  },
  {
    initialRouteName: 'Leaderboard',
    defaultNavigationOptions: {
      title: 'Game',
      headerLeft: null,
      headerStyle: {
        backgroundColor: green,
        marginTop: -22
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      },
      headerTintColor: 'white'
    }
  }
);


export default GameStack;
