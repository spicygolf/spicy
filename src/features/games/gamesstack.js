import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import Game from 'features/game/game';

import Games from 'features/games/games';
import NewGame from 'features/games/newGame';
import GameSetupWrapper from 'features/gameSetup/gameSetupWrapper';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';

import { green } from 'common/colors';


const GamesStack = createStackNavigator(
  {
    Games: Games,
    Game: Game,
    NewGame: NewGame,
    GameSetup: GameSetupWrapper,
    add_course: AddCourse,
    add_player: AddPlayer,
    //Score: Score,
    //Leaderboard: Leaderboard,
    //player_item: PlayerItem
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
