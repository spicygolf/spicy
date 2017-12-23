/**
 * # main.js
 *  This is the main app screen
 *
 */
'use strict';

import React from 'react';

import { TabNavigator } from 'react-navigation';

import { NavigationComponent } from 'react-native-material-bottom-navigation';

import Icon from '@expo/vector-icons/MaterialIcons';

import {
  tabActive,
  tabInactive,
  green,
  red,
  blue
} from '../lib/colors';

import Feed from '../containers/feed';
import Games from '../containers/games';
import Profile from '../containers/profile';


/**
 * ## Main App class
 */
const Main = TabNavigator(
  {
    Feed   : { screen: Feed    },
    Games  : { screen: Games   },
    Profile: { screen: Profile }
  },
  {
    initialRouteName: 'Games', // TODO: for development only
    tabBarComponent: NavigationComponent,
    tabBarPosition: 'bottom',
    tabBarOptions: {
      bottomNavigationOptions: {
        labelColor: tabInactive,
        activeLabelColor: tabActive,
        rippleColor: 'white',
        shifting: false,
        tabs: {
          Feed: {
            label: 'Feed',
            barBackgroundColor: blue,
            icon: <Icon size={24} color={tabInactive} name='message' />,
            activeIcon: <Icon size={24} color={tabActive} name='message' />
          },
          Games: {
            label: 'Games',
            barBackgroundColor: green,
            icon: <Icon size={24} color={tabInactive} name='playlist-add-check' />,
            activeIcon: <Icon size={24} color={tabActive} name='playlist-add-check' />
          },
          Profile: {
            label: 'Profile',
            barBackgroundColor: red,
            icon: <Icon size={24} color={tabInactive} name='account-box' />,
            activeIcon: <Icon size={24} color={tabActive} name='account-box' />
          }
        }
      }
    }
  }
);

// note anon function to export the navigator
export default () => <Main />;

//export default Main;
