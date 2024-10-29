import { createStackNavigator } from '@react-navigation/stack';
import { green } from 'common/colors';
import Game from 'features/game/game';
import Games from 'features/games/games';
import NewGame from 'features/games/newGame';
import NewGameCards from 'features/games/newGameCards';
import NewGameInfo from 'features/games/newGameInfo';
import NewGameList from 'features/games/newGameList';
import NewGameScreen from 'features/games/newGameScreen';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

const GamesStack = (props) => {
  const nada = {
    animation: 'timing',
    config: {
      duration: 0,
    },
  };

  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName="Games"
        screenOptions={{
          title: 'Games',
          headerMode: 'none',
          headerShown: false,
          headerStyle: {
            height: 0,
          },
        }}
      >
        <Stack.Screen name="Games" component={Games} />
        <Stack.Screen
          name="Game"
          component={Game}
          options={{
            transitionSpec: {
              open: nada,
              close: nada,
            },
          }}
        />
        <Stack.Screen name="NewGameScreen" component={NewGameScreen} />
        <Stack.Screen name="NewGameCards" component={NewGameCards} />
        <Stack.Screen name="NewGameList" component={NewGameList} />
        <Stack.Screen name="NewGameInfo" component={NewGameInfo} />
        <Stack.Screen
          name="NewGame"
          component={NewGame}
          options={{
            transitionSpec: {
              open: nada,
              close: nada,
            },
          }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

export default GamesStack;

const styles = StyleSheet.create({
  container: {
    backgroundColor: green,
    flex: 1,
  },
});
