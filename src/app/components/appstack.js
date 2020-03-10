import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import {
  Icon
} from 'react-native-elements';

import FeedStack from 'features/feed/feedstack';
import GamesStack from 'features/games/gamesstack';
import ProfileStack from 'features/profile/profilestack';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';

import {
  green,
  red,
  blue
} from 'common/colors';



const TabIcon = ({type, name, color, testID}) => {
  return (
    <Icon
      size={24}
      color={color}
      type={type}
      name={name}
      testID={testID}
    />
  );
};


const AppStack = props => {

  const { route } = props;
  const { currentPlayerKey, token } = route.params;

  const Tab = createMaterialBottomTabNavigator();

  const tabs = (
    <Tab.Navigator
      initialRouteName='GamesStack'
      shifting={true}
      activeColor='#fff'
      inactiveColor='#ccc'
    >
      <Tab.Screen
        name='FeedStack'
        component={FeedStack}
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? '#fff' : '#ccc' }
                name='comment'
                type='font-awesome'
                />
            );
          },
          tabBarColor: blue,
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
              color={focused ? '#fff' : '#ccc' }
              name='edit'
              type='font-awesome'
              />
            );
          },
          tabBarColor: green,
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
              color={focused ? '#fff' : '#ccc' }
              name='user'
              type='font-awesome'
              />
            );
          },
          tabBarColor: red,
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
