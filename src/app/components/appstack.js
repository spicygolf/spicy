import React from 'react';
import {
  createBottomTabNavigator,
} from 'react-navigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import Feed from 'features/feed/feed';
import GameStack from 'features/games/gamestack';
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
      screen: Feed
    },
    GameStack: {
      screen: GameStack,
      navigationOptions: {
        title: 'Games',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          console.log('Games focused', focused);
          return (
            <TabIcon
              color={green}
              name='playlist-add-check'
              testID='games_tab'
            />
          );
        }
      }
    },
    Profile: {
      screen: Profile
    }
  },
  {
    initialRouteName: 'GameStack'
  }
);

export default AppStack;
