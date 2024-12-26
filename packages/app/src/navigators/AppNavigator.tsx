import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColors } from 'hooks/useColors';
import { GamesNavigator } from 'navigators/GamesNavigator';
import { ProfileNavigator } from 'navigators/ProfileNavigator';

export function AppNavigator() {
  const Tabs = createBottomTabNavigator();
  const { colors, isDarkMode } = useColors();

  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: isDarkMode ? colors.white : colors.black,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: isDarkMode ? colors.black : colors.white,
          borderTopWidth: 0,
        },
      }}
      initialRouteName="games"
    >
      <Tabs.Screen
        name="games"
        component={GamesNavigator}
        options={{
          title: 'Games',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={28} name="pencil" color={color} iconStyle='solid' />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 size={28} name="user" color={color} iconStyle='solid' />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
