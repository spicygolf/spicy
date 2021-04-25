import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import FeedHome from 'features/feed/feedhome';
import { blue } from 'common/colors';



const FeedStack = props => {

  const Stack = createStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator
        initialRouteName='FeedHome'
        screenOptions={{
          title: 'Feed',
          headerShown: false,
        }}
      >
        <Stack.Screen
          name='FeedHome'
          component={FeedHome}
          options={{
            title: 'Feed',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );

};

export default FeedStack;


const styles = StyleSheet.create({
  container: {
    backgroundColor: blue,
    flex: 1,
  },
});
