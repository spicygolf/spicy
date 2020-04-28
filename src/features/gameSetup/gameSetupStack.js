import React from 'react';
import { createStackNavigator }  from '@react-navigation/stack';

import GameSetupScreen from 'features/gameSetup/gameSetupScreen';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';
import EditPlayer from 'features/gameSetup/editPlayer';
import LinkRoundList from 'features/gameSetup/linkRoundList';
import LinkRound from 'features/gameSetup/linkRound';



const GameSetupStack = props => {

  const nada = {
    animation: 'timing',
    config: {
      duration: 0,
    },
  };

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='GameSetup'
      headerMode='none'
    >
      <Stack.Screen
        name='GameSetup'
        component={GameSetupScreen}
      />
      <Stack.Screen
        name='AddCourse'
        component={AddCourse}
      />
      <Stack.Screen
        name='AddPlayer'
        component={AddPlayer}
      />
      <Stack.Screen
        name='EditPlayer'
        component={EditPlayer}
      />
      <Stack.Screen
        name='LinkRoundList'
        component={LinkRoundList}
        options={{
          transitionSpec: {
            open: nada,
            close: nada,
          },
        }}
      />
      <Stack.Screen
        name='LinkRound'
        component={LinkRound}
        options={{
          transitionSpec: {
            open: nada,
            close: nada,
          },
        }}
      />
    </Stack.Navigator>
  );

};

export default GameSetupStack;
