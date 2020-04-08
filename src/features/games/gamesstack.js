import React from 'react';
import {
  SafeAreaView
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import Game from 'features/game/game';
import Games from 'features/games/games';
import NewGameList from 'features/games/newGameList';
import NewGameInfo from 'features/games/newGameInfo';
import NewGame from 'features/games/newGame';



const GamesStack = props => {

  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={{flex: 1,}}>
      <Stack.Navigator
        initialRouteName='Games'
        screenOptions={{
          title: 'Games',
          headerMode: 'none',
          headerShown: false,
          headerStyle: {
            height: 0,
          },
        }}
      >
        <Stack.Screen name='Games' component={Games} />
        <Stack.Screen name='Game' component={Game} />
        <Stack.Screen name='NewGameList' component={NewGameList} />
        <Stack.Screen name='NewGameInfo' component={NewGameInfo} />
        <Stack.Screen name='NewGame' component={NewGame} />
      </Stack.Navigator>
    </SafeAreaView>
  );

};

export default GamesStack;
