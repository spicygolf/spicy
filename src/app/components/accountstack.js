import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Login from 'features/account/login';



const AccountStack = props => {

  const Stack = createStackNavigator();

  // TODO: create Register screen
  // TODO: create ForgotInfo screen

  return (
    <Stack.Navigator>
      <Stack.Screen name='Login' component={Login} />
    </Stack.Navigator>
  );

};

export default AccountStack;
