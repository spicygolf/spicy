import React from 'react';
import {
  createMaterialTopTabNavigator
} from 'react-navigation';

import Icon from 'react-native-vector-icons/MaterialIcons';

import AddCourseFavorites from 'features/gameSetup/addCourseFavorites';
import AddCourseSearch from 'features/gameSetup/addCourseSearch';

import { green } from 'common/colors';



const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name}/>
  );
};

const AddCourseTabs = createMaterialTopTabNavigator(
  {
    AddCourseFavorites: {
      screen: AddCourseFavorites,
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
    AddCourseSearch: {
      screen: AddCourseSearch,
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
    initialRouteName: 'AddCourseFavorites',
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


export default AddCourseTabs;
