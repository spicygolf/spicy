import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { green } from 'common/colors';
import { getCoursesPlayersTxt } from 'common/utils/game';
import { GameContext } from 'features/game/gameContext';
import Leaderboard from 'features/game/leaderboard';
import Score from 'features/game/score';
import GameSetupStack from 'features/gameSetup/gameSetupStack';
import moment from 'moment';
import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const GameStack = (props) => {
  const { game } = useContext(GameContext);
  const { gamespecs } = game;
  const gamespec_name = gamespecs.map((gs) => gs.disp).join('-');
  const start = moment(game.start).format('llll');
  const { courseFull } = getCoursesPlayersTxt(game);

  const Tab = createMaterialTopTabNavigator();

  return (
    <View style={styles.container}>
      <View style={styles.gname}>
        <Text style={styles.gname_txt}>
          {gamespec_name} - {start}
        </Text>
        <Text style={styles.subtitle}>{`${courseFull}`}</Text>
      </View>
      <Tab.Navigator
        initialRouteName="Score"
        screenOptions={{
          inactiveTintColor: '#ccc',
          inactiveBackgroundColor: '#666',
          activeTintColor: '#fff',
          style: {
            backgroundColor: green,
          },
        }}
        tabBarOptions={{
          labelStyle: styles.tabBarLabel,
          style: styles.tabBar,
        }}
        swipeEnabled={false}>
        <Tab.Screen
          name="Leaderboard"
          component={Leaderboard}
          options={{
            title: 'Leaderboard',
            tabBarTestID: 'game_leaderboard_tab',
          }}
        />
        <Tab.Screen
          name="Score"
          component={Score}
          options={{
            title: 'Score',
            tabBarTestID: 'game_score_tab',
          }}
        />
        <Tab.Screen
          name="Setup"
          component={GameSetupStack}
          options={{
            title: 'Setup',
            tabBarTestID: 'game_setup_tab',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

export default GameStack;

const styles = StyleSheet.create({
  container: {
    flex: 12,
  },
  gname: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 5,
  },
  gname_txt: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 12,
  },
  tabBar: {
    height: 35,
    maxHeight: 35,
  },
  tabBarLabel: {
    textTransform: 'capitalize',
  },
});
