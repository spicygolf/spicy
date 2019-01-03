import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import Games from 'features/games/games';
import Game from 'features/games/game';
import Score from 'features/games/score';

import NewGame from 'features/games/newGame';
import GameSetup from 'features/gameSetup/gameSetup';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';
import PlayerItem from 'features/players/playerItem';

import Header from 'common/components/header';
import { green } from 'common/colors';


const GameStack = createStackNavigator(
  {
    Games: Games,
    Game: Game,
    Score: Score,
    NewGame: NewGame,
    GameSetup: GameSetup,
    AddCourse: AddCourse,
    AddPlayer: AddPlayer,
    PlayerItem: PlayerItem
  },
  {
    initialRouteName: 'Games',
    defaultNavigationOptions: {
      title: 'Games',
      headerStyle: {
        backgroundColor: green
      },
      headerTintColor: 'white'
    }
  }
);


export default GameStack;
