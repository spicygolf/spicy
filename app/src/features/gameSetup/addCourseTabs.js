import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { green } from 'common/colors';
import AddCourseFavorites from 'features/gameSetup/addCourseFavorites';
import AddCourseSearchCourse from 'features/gameSetup/addCourseSearchCourse';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TabIcon = ({ name, color }) => {
  return <Icon size={24} color={color} name={name} />;
};

const AddCourseTabs = (props) => {
  const Tab = createMaterialTopTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName="AddCourseFavorites"
      screenOptions={{}}
      tabBarOptions={{
        activeTintColor: green,
        inactiveTintColor: '#555',
        style: {
          backgroundColor: 'none',
        },
        indicatorStyle: {
          backgroundColor: green,
        },
        showIcon: true,
        labelStyle: {
          textTransform: 'none',
        },
      }}
    >
      <Tab.Screen
        name="AddCourseFavorites"
        component={AddCourseFavorites}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="star" />;
          },
        }}
      />
      <Tab.Screen
        name="AddCourseSearchCourse"
        component={AddCourseSearchCourse}
        options={{
          title: 'GHIN®\nSearch',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="search" />;
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default AddCourseTabs;
