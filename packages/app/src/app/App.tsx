import React, {StrictMode} from 'react';
import {useDemoAuth, DemoAuthBasicUI} from 'jazz-react-native';
import { NavigationContainer } from '@react-navigation/native';
import {StyleSheet} from 'react-native-unistyles';
import {appThemes} from 'utils/themes';

import {Jazz} from 'providers/jazz/';
import { AppNavigator } from 'navigators/AppNavigator';
import { MMKVStore } from 'providers/jazz/mmkv-store';

export default function App() {
  const store = new MMKVStore();
  // store.clearAll();
  const [auth, state] = useDemoAuth({store});
  if (!auth) {
    return null;
  }

  return (
    <StrictMode>
      {state.state !== 'signedIn' ? (
        <DemoAuthBasicUI appName="Spicy Golf" state={state} />
      ) : null}
      <Jazz.Provider
        auth={auth}
        peer={'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf'}
        storage={undefined}
      >
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </Jazz.Provider>
    </StrictMode>
  );
}

StyleSheet.configure({
  themes: appThemes,
  // breakpoints,
  // settings
});
