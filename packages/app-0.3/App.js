import { ApolloProvider } from '@apollo/client';
import auth from '@react-native-firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import configureClient from 'app/client/configureClient';
import AccountStack from 'app/components/accountstack';
import AppStack from 'app/components/AppStack';
import Splash from 'features/splash/splash';
import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import { Provider as PaperProvider } from 'react-native-paper';
import { clearCache } from './src/common/utils/account';

const App = () => {
  const [client, setClient] = useState(undefined);

  const user = {};
  const email = 'brad@sankatygroup.com';
  const fbToken = '123456789';

  // const [initializing, setInitializing] = useState(true);
  // const [user, setUser] = useState();

  // // Handle user state changes
  // const onAuthStateChanged = (u) => {
  //   setUser(u);
  // };

  useEffect(() => {
    RNBootSplash.hide({ duration: 250 });
    // const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    // return subscriber; // unsubscribe on unmount
  });

  useEffect(() => {
    const configClient = async () => {
      const c = await configureClient();
      // await clearCache(c); // Don't always need this, but it's handy for dev
      setClient(c);
    };
    configClient();
  }, []);

  // get data from firebaseUser
  // const [email, setEmail] = useState('');
  // const [fbToken, setFbToken] = useState('');
  // useEffect(() => {
  //   const getFbData = async (fbUser) => {
  //     const fbt = await fbUser.getIdToken();
  //     setFbToken(fbt);
  //     setEmail(fbUser.email);
  //     if (initializing) {
  //       setInitializing(false);
  //     }
  //   };
  //   if (user) {
  //     getFbData(user);
  //   }
  // }, [initializing, user]);

  useEffect(() => {
    LogBox.ignoreLogs([
      'VirtualizedLists should never be nested',
      'Non-serializable values were found in the navigation state',
      'Require cycle',
      'VirtualizedLists should never be nested',
      'Warning: Overlay: Support for defaultProps',
      'Warning: TextElement: Support for defaultProps',
      'TypeError: _reactNative.AppState.removeEventListener',
      'Possible unhandled Promise rejection',
      //        'Cannot update a component from inside',
      //        'Cache data may be lost',
      //        'Remote debugger is in',
    ]);
  }, []);

  // let content = null;
  if (!client) {
    return <Splash />;
  }

  // if (user && email && fbToken) {
  const content = <AppStack email={email} fbToken={fbToken} fbUser={user} />;
  // } else {
  //   content = <AccountStack />;
  // }
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <PaperProvider>{content}</PaperProvider>
      </NavigationContainer>
    </ApolloProvider>
  );
};

export default App;
