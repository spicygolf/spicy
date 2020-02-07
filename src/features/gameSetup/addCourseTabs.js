import React from 'react';
import {
  createMaterialTopTabNavigator
} from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/MaterialIcons';

import AddCourseFavorites from 'features/gameSetup/addCourseFavorites';
import AddCourseSearch from 'features/gameSetup/addCourseSearch';

import { green } from 'common/colors';



const TabIcon = ({name, color}) => {
  return (
    <Icon size={24} color={color} name={name}/>
  );
};

const AddCourseTabs = props => {

  const Tab = createMaterialTopTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName='AddCourseFavorites'
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name='AddCourseFavorites'
        component={AddCourseFavorites}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? green : '#555' }
                name='star'
              />
            );
          },
        }}
      />
      <Tab.Screen
        name='AddCourseSearch'
        component={AddCourseSearch}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? green : '#555' }
                name='search'
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );

};

export default AddCourseTabs;
