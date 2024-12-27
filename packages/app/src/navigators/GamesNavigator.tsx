import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GamesList from '@/screens/GamesList';
import { NewGame } from '@/screens/NewGame';

export function GamesNavigator() {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator initialRouteName="GamesList">
      <Stack.Screen
        name="GamesList"
        component={GamesList}
        options={{
          title: 'Games',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NewGame"
        component={NewGame}
        options={{
          title: 'New Game',
          headerShown: false,
        }}
      />
      {/* <Stack.Screen
        name="Game"
        component={GameStack}
        options={{
          title: "Game",
          headerShown: false,
        }}
      /> */}
    </Stack.Navigator>
  );
}
