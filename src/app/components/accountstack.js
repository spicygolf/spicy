import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Login from 'features/account/login';
import Register from 'features/account/register';
import Forgot from 'features/account/forgot';



const AccountStack = props => {

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      initialRouteName='Login'
    >
      <Stack.Screen name='Login' component={Login} />
      <Stack.Screen name='Register' component={Register} />
      <Stack.Screen name='Forgot' component={Forgot} />
    </Stack.Navigator>
  );

};

export default AccountStack;
