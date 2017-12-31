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
import Games from '../containers/games';
import Profile from '../containers/profile';

const reducerCreate = params => {
  const defaultReducer = new Reducer(params);
  return (state, action) => {
    console.log('ACTION:', action);
    return defaultReducer(state, action);
  };
};

const styles = StyleSheet.create({
  bottomNav: { // TODO: get Safe Area somehow
    paddingBottom: 34,
    height: 56 + 34
  }
});

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
                  key='games_home'
                  component={Games}
                  hideNavBar
                  initial
                />
                <Scene
                  key='game'
                  component={Game}
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
