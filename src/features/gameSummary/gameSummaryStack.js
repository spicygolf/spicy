import React from 'react';
import { createStackNavigator }  from '@react-navigation/stack';

import GameSummary from 'features/gameSummary/gameSummary';
import PostScores from 'features/gameSummary/postScores';



const GameSummaryStack = props => {

  const nada = {
    animation: 'timing',
    config: {
      duration: 0,
    },
  };

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='GameSummary'
      headerMode='none'
    >
      <Stack.Screen
        name='GameSummary'
        component={GameSummary}
      />
      <Stack.Screen
        name='PostScores'
        component={PostScores}
      />
    </Stack.Navigator>
  );

};

export default GameSummaryStack;
