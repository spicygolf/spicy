import React from 'react';
import {
  createMaterialTopTabNavigator
} from 'react-navigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import AddPlayerFavorites from 'features/gameSetup/addPlayerFavorites';
import AddPlayerSearch from 'features/gameSetup/addPlayerSearch';

import { green } from 'common/colors';



const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name}/>
  );
};

const AddPlayerTabs = createMaterialTopTabNavigator(
  {
    AddPlayerFavorites: {
      screen: AddPlayerFavorites,
      navigationOptions: {
        title: 'Favorites',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          return (
            <TabIcon
              color={focused ? green : '#555' }
              name='star'
            />
          );
        },
      },
    },
    AddPlayerSearch: {
      screen: AddPlayerSearch,
      navigationOptions: {
        title: 'Search',
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          return (
            <TabIcon
              color={focused ? green : '#555' }
              name='search'
            />
          );
        },
      },
    },
  }, {
    initialRouteName: 'AddPlayerFavorites',
    tabBarOptions: {
      activeTintColor: green,
      inactiveTintColor: '#555',
      style: {
        backgroundColor: 'none',
      },
      indicatorStyle: {
        backgroundColor: green
      },
      showIcon: true
    }
  }
);


export default AddPlayerTabs;
