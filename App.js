import React, { Component } from 'react';
import { NavigationNativeContainer } from '@react-navigation/native';
import { ApolloProvider } from 'react-apollo';
import { ApolloProvider as ApolloHooksProvider } from '@apollo/react-hooks';
import { createStackNavigator } from '@react-navigation/stack';

import Splash from 'features/splash/splash';
import AppStack from 'app/components/appstack';
import AuthStack from 'app/components/authstack';

import configureClient from 'app/client/configureClient';


const App = props => {

  const { client, persistor } = configureClient();
  const Stack = createStackNavigator();

  return (
    <ApolloProvider client={client}>
      <ApolloHooksProvider client={client}>
        <NavigationNativeContainer>
          <Stack.Navigator
            initialRouteName='Splash'
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name='Splash' component={Splash} />
            <Stack.Screen name='App' component={AppStack} />
            <Stack.Screen name='Auth' component={AuthStack} />
          </Stack.Navigator>
        </NavigationNativeContainer>
      </ApolloHooksProvider>
    </ApolloProvider>
  );

};

export default App;

// temporary for RN #3965
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Module RCTImageLoader',
  'VirtualizedLists should never be nested',
]);
