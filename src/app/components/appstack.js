import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from 'react-native-vector-icons/MaterialIcons';

import FeedStack from 'features/feed/feedstack';
import GamesStack from 'features/games/gamesstack';
import ProfileStack from 'features/profile/profilestack';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';

import {
  green,
  red,
  blue
} from 'common/colors';



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
  }}
    >
      <Tab.Screen
        name='FeedStack'
        component={FeedStack}
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
        name='ProfileStack'
        component={ProfileStack}
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
