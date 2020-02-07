import React from 'react';
import { createStackNavigator }  from '@react-navigation/stack';

import GameSetupScreen from 'features/gameSetup/gameSetupScreen';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';
import LinkRound from 'features/gameSetup/linkRound';



const GameSetupStack = props => {

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='GameSetup'
      headerMode='none'
    >
      <Stack.Screen name='GameSetup' component={GameSetupScreen} />
      <Stack.Screen name='AddCourse' component={AddCourse} />
      <Stack.Screen name='AddPlayer' component={AddPlayer} />
      <Stack.Screen name='LinkRound' component={LinkRound} />
    </Stack.Navigator>
  );

};

export default GameSetupStack;
