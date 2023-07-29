import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { green } from 'common/colors';
import AddCourseFavorites from 'features/gameSetup/addCourseFavorites';
import AddCourseSearchCourse from 'features/gameSetup/addCourseSearchCourse';
import AddCourseSelectedTees from 'features/gameSetup/addCourseSelectedTees';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TabIcon = ({ name, color }) => {
  return <Icon size={24} color={color} name={name} />;
};

const AddCourseTabs = (props) => {
  const { player } = props;
  const Tab = createMaterialTopTabNavigator();

  return (
    <View style={styles.container}>
      <Text style={styles.playerName}>{player?.name}</Text>
      <AddCourseSelectedTees />
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
        }}>
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
    </View>
  );
};

export default AddCourseTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerName: {
    alignSelf: 'center',
  },
});
