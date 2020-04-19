/*
 * @format
 * @flow strict-local
 *
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ApolloProvider } from 'react-apollo';
import { ApolloProvider as ApolloHooksProvider } from '@apollo/client';
import { Provider as PaperProvider } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import RNBootSplash from "react-native-bootsplash";

import Splash from 'features/splash/splash';
import AppStack from 'app/components/appstack';
import AccountStack from 'app/components/accountstack';

import configureClient from 'app/client/configureClient';


const App = props => {

  const { client } = configureClient();

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  const onAuthStateChanged = (user) => {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(
    () => {
      RNBootSplash.hide({ duration: 250 });
      const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
      return subscriber; // unsubscribe on unmount
    }, []
  );

  let content = null;
  if( initializing ) {
    content = (<Splash />);
  } else {
    if( user ) {
      content = (<AppStack user={user} />);
    } else {
      content = (<AccountStack />);
    }
  }

  return (
    <ApolloProvider client={client}>
      <ApolloHooksProvider client={client}>
        <NavigationContainer>
          <PaperProvider>
            { content }
          </PaperProvider>
        </NavigationContainer>
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
