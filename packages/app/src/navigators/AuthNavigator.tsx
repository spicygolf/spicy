import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Login } from '@/screens/auth/Login';
import { Register } from '@/screens/auth/Register';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AuthStackNavigationProp =
  NativeStackNavigationProp<AuthStackParamList>;

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
