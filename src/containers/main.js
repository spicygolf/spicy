/**
 * # main.js
 *  This is the main app screen
 *
 */
'use strict';

import React from 'react';

import {
  StyleSheet
} from 'react-native';

import {
  Reducer,
  Router,
  Scene,
  Stack,
  Tabs
} from 'react-native-router-flux';

import Icon from '@expo/vector-icons/MaterialIcons';

import {
  tabActive,
  tabInactive,
  green,
  red,
  blue
} from '../lib/colors';

import Feed from '../containers/feed';
import Game from '../containers/game';
import Score from '../containers/score';
import Games from '../containers/games';
import Profile from '../containers/profile';

import GamesHeader from '../components/games_header';


const reducerCreate = params => {
  const defaultReducer = new Reducer(params);
  return (state, action) => {
    //console.log('ACTION:', action);
    return defaultReducer(state, action);
  };
};

const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name} />
  );
};

/**
 * ## Main App class
 */
export default class Main extends React.Component {

  render() {
    return (
      <Router
        createReducer={reducerCreate}
      >
        <Stack key='root'>
          <Scene key='main' hideNavBar panHandlers={null}>
            <Tabs
              key='main_tabs'
              inactiveTintColor={tabInactive}
              activeTintColor={tabInactive}
            >
              <Scene
                key='feed'
                component={Feed}
                icon={() => <TabIcon color={blue} name='message'/>}
                tabBarLabel="Feed"
                hideNavBar
              />
              <Stack
                key='games'
                initial
                icon={() => <TabIcon color={green} name='playlist-add-check'/>}
                tabBarLabel="Games"
              >
                <Scene
                  key='games'
                  component={Games}
                  navBar={GamesHeader}
                  initial
                />
                <Scene
                  key='game'
                  component={Game}
                  navBar={GamesHeader}
                />
                <Scene
                  key='score'
                  component={Score}
                  navBar={GamesHeader}
                />
              </Stack>
              <Scene
                key='profile'
                component={Profile}
                icon={() => <TabIcon color={red} name='account-box'/>}
                tabBarLabel="Profile"
                hideNavBar
              />
            </Tabs>
          </Scene>
        </Stack>
      </Router>
    );
  }
};
