import React from 'react';

import {
  ActivityIndicator,
  AsyncStorage,
  StyleSheet
} from 'react-native';

import {
  createStackNavigator,
  createAppContainer
} from "react-navigation";

import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  tabActive,
  tabInactive,
  green,
  red,
  blue
} from 'common/colors';

import Splash from 'features/splash/splash';

import Login from 'features/login/login';

import Feed from 'features/feed/feed';

import Games from 'features/games/games';
import Game from 'features/games/game';
import GamesHeader from 'features/games/header';
import Score from 'features/games/score';
import NewGame from 'features/games/newGame';

import GameSetup from 'features/gameSetup/gameSetup';
import AddCourse from 'features/gameSetup/addCourse';
import AddPlayer from 'features/gameSetup/addPlayer';

import PlayerItem from 'features/players/playerItem';

import Profile from 'features/profile/profile';

import { createTabsReducer } from './TabsReducer';


const TabIcon = ({name, color, testID}) => {
  return (
    <Icon size={24} color={color} name={name} testID={testID}/>
  );
};


class TabsContainer extends React.Component {

/*
  render() {
    return (
      <Router
        createReducer={createTabsReducer}
      >
        <Stack key='root'>
          <Scene
            key='splash'
            component={Splash}
            type='replace'
            hideNavBar
            panHandlers={null}
          />
          <Scene
            key='login'
            component={Login}
            type='replace'
            hideNavBar
            panHandlers={null}
          />
          <Scene
            key='tabs'
            type='replace'
            hideNavBar
            panHandlers={null}
          >
            <Tabs
              key='main_tabs'
              inactiveTintColor={tabInactive}
              activeTintColor={tabInactive}
            >
              <Scene
                key='feed'
                component={Feed}
                icon={() => <TabIcon
                  color={blue}
                  name='message'
                  testID='feed_tab'
                />}
                tabBarLabel="Feed"
                hideNavBar
              />
              <Stack
                key='games'
                initial
                icon={() => <TabIcon
                  color={green}
                  name='playlist-add-check'
                  testID='games_tab'
                />}
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
                  key='game_setup'
                  component={GameSetup}
                  navBar={GamesHeader}
                />
                <Scene
                  {...this.props}
                  key='player_item'
                  component={PlayerItem}
                  navBar={GamesHeader}
                />
                <Scene
                  {...this.props}
                  key='add_course'
                  component={AddCourse}
                  navBar={GamesHeader}
                />
                <Scene
                  {...this.props}
                  key='add_player'
                  component={AddPlayer}
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
                icon={() => <TabIcon
                  color={red}
                  name='account-box'
                  testID='profile_tab'
                  />}
                tabBarLabel="Profile"
                hideNavBar
              />
            </Tabs>
          </Scene>
        </Stack>
      </Router>
    );
  }
*/
};

export default TabsContainer;
