import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Game from 'features/game/game';
import Games from 'features/games/games';
import NewGame from 'features/games/newGame';

import { green } from 'common/colors';



const GamesStack = props => {

const Stack = createStackNavigator();

return (
  <Stack.Navigator
    initialRouteName='Games'
    screenOptions={{
      title: 'Games',
      headerLeft: null,
      headerStyle: {
        backgroundColor: green,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      },
      headerTintColor: 'white'
    }}
  >
    <Stack.Screen name='Games' component={Games} />
    <Stack.Screen name='Game' component={Game} />
    <Stack.Screen name='New Game' component={NewGame} />
  </Stack.Navigator>
);

};

export default GamesStack;
