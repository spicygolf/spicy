import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileHome } from '@/screens/profile/ProfileHome';

export function ProfileNavigator() {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHome}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
