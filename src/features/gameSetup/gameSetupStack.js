import React from 'react';
import {
  createStackNavigator
} from 'react-navigation';

import GameSetupScreen from 'features/gameSetup/gameSetupScreen';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';



const GameSetupStack = createStackNavigator(
  {
    GameSetup: GameSetupScreen,
    AddCourse: AddCourse,
    AddPlayer: AddPlayer,
  },
  {
    initialRouteName: 'GameSetup',
    headerMode: "none"
  }
);


export default GameSetupStack;
