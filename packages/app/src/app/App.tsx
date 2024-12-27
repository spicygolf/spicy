import React, { StrictMode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDemoAuth, DemoAuthBasicUI } from 'jazz-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigators/AppNavigator';
import { Jazz } from '@/providers/jazz/';
import { MMKVStore } from '@/providers/jazz/mmkv-store';

export default function App() {
  const store = new MMKVStore();
  const [auth, state] = useDemoAuth({ store });
  if (!auth) {
    return null;
  }

  return (
    <StrictMode>
      <SafeAreaProvider>
        {state.state !== 'signedIn' ? (
          <DemoAuthBasicUI appName="Spicy Golf" state={state} />
        ) : null}
        <Jazz.Provider
          auth={auth}
          peer={'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf'}
          storage={undefined}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </Jazz.Provider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
