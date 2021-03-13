import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileHome from 'features/profile/profilehome';
import { red } from 'common/colors';



const ProfileStack = props => {

  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName='ProfileHome'
        screenOptions={{
          title: 'Profile',
          headerMode: 'none',
          headerShown: false,
          headerStyle: {
            height: 0,
          },
      }}
      >
        <Stack.Screen name='ProfileHome' component={ProfileHome} />
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
