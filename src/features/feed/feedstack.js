import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import Stats from 'features/feed/stats';
import Games from 'features/feed/games';
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
          name='FeedStats'
          component={Stats}
          options={{
            title: 'Feed',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name='FeedGames'
          component={Games}
          options={{
            title: 'Games',
            headerShown: true,
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
