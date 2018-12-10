import React from 'react';

import {
  AsyncStorage,
  StyleSheet
} from 'react-native';

import {
  Actions,
  Router,
  Scene,
  Stack,
  Tabs
} from 'react-native-router-flux';
import {
  ApolloConsumer
} from 'react-apollo';

import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  tabActive,
  tabInactive,
  green,
  red,
  blue
} from 'common/colors';
import jwtDecode from 'jwt-decode';
import { withApollo } from 'react-apollo';
import { GET_PLAYER_QUERY } from 'features/players/graphql';

import Login from 'features/login/login';

import Feed from 'features/feed/feed';

import Games from 'features/games/games';
import Game from 'features/games/game';
import GamesHeader from 'features/games/header';
import Score from 'features/games/score';
import NewGame from 'features/games/newGame';
import GameSetup from 'features/gameSetup/gameSetup';

import Profile from 'features/profile/profile';

import { getPlayer } from 'features/players/graphql';

import { createTabsReducer } from './TabsReducer';


const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name} />
  );
};


class TabsContainer extends React.Component {

  async componentDidMount() {

    const token = await AsyncStorage.getItem('token');

    // if no token, render Login component
    if( !token ) {
      Actions.login();
    }

    // we have token, so get current player (from server or cache) and then
    // render TabsContainer
    const { pkey } = jwtDecode(token);
    await this.props.client.query({
      query: GET_PLAYER_QUERY,
      variables: {
        player: pkey
      }
    });

    Actions.main();
  }

  render() {
    return (
      <Router
        createReducer={createTabsReducer}
      >
        <Stack key='root'>
          <Scene key='login' component={Login} hideNavBar panHandlers={null} />
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
                  key='game_setup'
                  component={GameSetup}
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

export default withApollo(TabsContainer);
