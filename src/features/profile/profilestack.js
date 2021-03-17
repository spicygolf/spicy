import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileHome from 'features/profile/profilehome';
import LinkHandicap from 'features/profile/linkHandicap';
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
