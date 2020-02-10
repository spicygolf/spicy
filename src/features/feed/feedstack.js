import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import FeedHome from 'features/feed/feedhome';
import { blue } from 'common/colors';



const FeedStack = props => {

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='FeedHome'
      screenOptions={{
        title: 'Feed',
        headerLeft: null,
        headerStyle: {
          backgroundColor: blue,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        headerTintColor: 'white'
      }}
    >
      <Stack.Screen name='FeedHome' component={FeedHome} />
    </Stack.Navigator>
  );

};

export default FeedStack;
