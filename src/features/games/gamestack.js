import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import Games from 'features/games/games';
import Game from 'features/games/game';
import Score from 'features/games/score';

import NewGame from 'features/games/newGame';
import GameSetupWrapper from 'features/gameSetup/gameSetupWrapper';
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
    GameSetup: GameSetupWrapper,
    add_course: AddCourse,
    add_player: AddPlayer,
    player_item: PlayerItem
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


export default GameStack;
