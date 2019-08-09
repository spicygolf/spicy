import React from 'react';
import {
  createBottomTabNavigator,
} from 'react-navigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Feed from 'features/feed/feed';
import GamesStack from 'features/games/gamesstack';
import Profile from 'features/profile/profile';

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


const AppStack = createBottomTabNavigator(
  {
    Feed: {
      screen: Feed,
      navigationOptions: {
        title: 'Feed',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
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
      }
    },
    GamesStack: {
      screen: GamesStack,
      navigationOptions: {
        title: 'Games',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
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
      }
    },
    Profile: {
      screen: Profile,
      navigationOptions: {
        title: 'Profile',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
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
      }
    }
  },
  {
    initialRouteName: 'GamesStack',
    defaultNavigationOptions: {
      tabBarOptions: {
        inactiveBackgroundColor: 'white',
        inactiveTintColor: '#333'
      }
    }
  }
);

export default AppStack;
