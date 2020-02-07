import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Feed from 'features/feed/feed';
import GamesStack from 'features/games/gamesstack';
import Profile from 'features/profile/profile';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';

import {
  green,
  red,
  blue
} from 'common/colors';
import AsyncStorage from '@react-native-community/async-storage';



const TabIcon = ({name, color, testID}) => {
  return (
    <Icon size={24} color={color} name={name} testID={testID}/>
  );
};


const AppStack = props => {

  const { route } = props;
  const { currentPlayerKey, token } = route.params;

  const Tab = createBottomTabNavigator();

  const tabs = (
    <Tab.Navigator
      initialRouteName='GamesStack'
      screenOptions={{}}
      tabBarOptions={{
        inactiveBackgroundColor: 'white',
        inactiveTintColor: '#333',
        activeBackgroundColor: green,
        activeTintColor: 'white'
  }}
    >
      <Tab.Screen
        name='Feed'
        component={Feed}
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? 'white' : blue }
                name='message'
              />
            );
          },
          tabBarOptions: {
              activeBackgroundColor: blue,
              activeTintColor: 'white'
          },
          tabBarTestID: 'feed_tab'
        }}
      />
      <Tab.Screen
        name='GamesStack'
        component={GamesStack}
        options={{
          title: 'Games',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? 'white' : green }
                name='playlist-add-check'
              />
            );
          },
          tabBarOptions: {
            activeBackgroundColor: green,
            activeTintColor: 'white'
          },
          tabBarTestID: 'games_tab'
        }}
      />
      <Tab.Screen
        name='Profile'
        component={Profile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? 'white' : red }
                name='account-box'
              />
            );
          },
          tabBarOptions: {
              activeBackgroundColor: red,
              activeTintColor: 'white'
          },
          tabBarTestID: 'profile_tab'
        }}
      />
    </Tab.Navigator>
  );


  return (
    <CurrentPlayerContext.Provider value={{
      currentPlayerKey: currentPlayerKey,
      token: token,
    }}>
      {tabs}
    </CurrentPlayerContext.Provider>
  );

};

export default AppStack;
