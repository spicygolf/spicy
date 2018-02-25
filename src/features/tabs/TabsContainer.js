/**
 * #
 *  This is the main (Tabs) app screen
 *
 */
'use strict';

import React from 'react';

import {
  StyleSheet
} from 'react-native';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
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
} from 'common/colors';

import Feed from 'features/feed/feed';

import Games from 'features/games/games';
import NewGame from 'features/games/newGame';
import Game from 'features/games/game';
import GamesHeader from 'features/games/header';
import Score from 'features/scores/score';

import Profile from 'features/profile/profile';


import { createTabsReducer } from './TabsReducer';


const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name} />
  );
};


class TabsContainer extends React.Component {

  render() {
    return (
      <Router
        createReducer={createTabsReducer}
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
                  {...this.props}
                  key='games'
                  component={Games}
                  navBar={GamesHeader}
                  initial
                />
                <Scene
                  {...this.props}
                  key='newGame'
                  component={NewGame}
                  navBar={GamesHeader}
                />
                <Scene
                  {...this.props}
                  key='game'
                  component={Game}
                  navBar={GamesHeader}
                />
                <Scene
                  {...this.props}
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

const mapState = (state) => {
  // TODO: maybe stick currentTab into state?
  return {};
}

// TODO: maybe stick selectTab in here?
const actions = {};

export default connect(mapState, actions)(TabsContainer);
