import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileHome from 'features/profile/profilehome';
import LinkHandicap from 'features/profile/linkHandicap';
import SettingsHome from 'features/profile/settings/settings.js';
import Account from 'features/profile/settings/account.js';
import AccountChange from 'features/profile/settings/accountChange.js';
import ClearCache from 'features/profile/settings/clearCache.js';
import Logout from 'features/profile/settings/logout.js';
import Impersonate from 'features/profile/settings/impersonate.js';
import { red } from 'common/colors';



const ProfileStack = props => {

  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName='ProfileHome'
        screenOptions={{
        }}
      >
        <Stack.Screen
          name='ProfileHome'
          component={ProfileHome}
          options={{
            title: 'Profile',
            headerMode: 'none',
            headerShown: 'false',
            headerStyle: {
              height: 0,
            },
          }}
        />
        <Stack.Screen
          name='LinkHandicap'
          component={LinkHandicap}
          options={{
            title: 'Link Handicap Service',
            headerShown: 'false',
          }}
        />
        <Stack.Screen
          name='Settings'
          component={SettingsHome}
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name='Account'
          component={Account}
          options={{
            title: 'Account',
          }}
        />
        <Stack.Screen
          name='AccountChange'
          component={AccountChange}
          options={{
            title: 'Change',
          }}
        />
        <Stack.Screen
          name='ClearCache'
          component={ClearCache}
          options={{
            title: 'Clear Local Data',
          }}
        />
        <Stack.Screen
          name='Logout'
          component={Logout}
          options={{
            title: 'Logout',
          }}
        />
        <Stack.Screen
          name='Impersonate'
          component={Impersonate}
          options={{
            title: 'Impersonate',
          }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );

};

export default ProfileStack;


const styles = StyleSheet.create({
  container: {
    backgroundColor: red,
    flex: 1,
  },
});
