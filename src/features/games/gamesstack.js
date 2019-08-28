import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import Game from 'features/game/game';
import Games from 'features/games/games';
import NewGame from 'features/games/newGame';
import GameSetup from 'features/gameSetup/gameSetup';

import { green } from 'common/colors';



const GamesStack = createStackNavigator(
  {
    Games: Games,
    Game: Game,
    NewGame: NewGame,
    GameSetup: GameSetup,
  },
  {
    initialRouteName: 'Games',
    defaultNavigationOptions: {
      title: 'Games',
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


export default GamesStack;
