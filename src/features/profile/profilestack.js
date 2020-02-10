import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileHome from 'features/profile/profilehome';
import { red } from 'common/colors';



const ProfileStack = props => {

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='ProfileHome'
      screenOptions={{
        title: 'Profile',
        headerLeft: null,
        headerStyle: {
          backgroundColor: red,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        headerTintColor: 'white'
      }}
    >
      <Stack.Screen name='ProfileHome' component={ProfileHome} />
    </Stack.Navigator>
  );

};

export default ProfileStack;
