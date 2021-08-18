import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { green } from 'common/colors';
import AddPlayerFavorites from 'features/gameSetup/addPlayerFavorites';
import AddPlayerGHINSearch from 'features/gameSetup/addPlayerGHINSearch';
import AddPlayerManual from 'features/gameSetup/addPlayerManual';
import AddPlayerSearch from 'features/gameSetup/addPlayerSearch';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TabIcon = ({ name, color }) => {
  return <Icon size={24} color={color} name={name} />;
};

const AddPlayerTabs = (props) => {
  const Tab = createMaterialTopTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName="AddPlayerFavorites"
      screenOptions={{}}
      tabBarOptions={{
        activeTintColor: green,
        inactiveTintColor: '#555',
        style: {
          backgroundColor: 'none',
        },
        labelStyle: {
          textTransform: 'none',
          fontSize: 12,
        },
        indicatorStyle: {
          backgroundColor: green,
        },
        tabStyle: {
          justifyContent: 'flex-start',
        },
        showIcon: true,
      }}
    >
      <Tab.Screen
        name="AddPlayerFavorites"
        component={AddPlayerFavorites}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="star" />;
          },
        }}
      />
      <Tab.Screen
        name="AddPlayerSearch"
        component={AddPlayerSearch}
        options={{
          title: 'Spicy Golf Search',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="search" />;
          },
        }}
      />
      <Tab.Screen
        name="AddPlayerGHINSearch"
        component={AddPlayerGHINSearch}
        options={{
          title: 'GHIN\nSearch',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="search" />;
          },
        }}
      />
      <Tab.Screen
        name="AddPlayerManual"
        component={AddPlayerManual}
        options={{
          title: 'Manual',
          tabBarIcon: ({ focused }) => {
            return <TabIcon color={focused ? green : '#555'} name="add" />;
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default AddPlayerTabs;
