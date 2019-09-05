import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import GameSetupScreen from 'features/gameSetup/gameSetupScreen';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';
import LinkRound from 'features/gameSetup/linkRound';



const GameSetupStack = createStackNavigator(
  {
    GameSetup: GameSetupScreen,
    AddCourse: AddCourse,
    AddPlayer: AddPlayer,
    LinkRound: LinkRound,
  },
  {
    initialRouteName: 'GameSetup',
    headerMode: "none"
  }
);


export default GameSetupStack;
