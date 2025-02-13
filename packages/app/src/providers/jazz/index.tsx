import React, { useEffect } from 'react';
import {
  DemoAuthBasicUI,
  JazzProvider,
  useDemoAuth,
  setupKvStore,
  // clearUserCredentials,
} from 'jazz-react-native';
import { RNQuickCrypto } from 'jazz-react-native/crypto';
import { PlayerAccount } from '@/schema/accounts';
import { MMKVStore } from './mmkv-store';

const auth_store = new MMKVStore();
// auth_store.clearAll();
// clearUserCredentials();

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  setupKvStore(auth_store);

  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';
  const [auth, state] = useDemoAuth({ store: auth_store });

  // console.log('state', state.state);
  // console.log('auth', auth);

  // if (state.state === 'loading' && auth) {
  //   auth.start();
  // }

  if (state.state === 'ready' && auth) {
    return <DemoAuthBasicUI appName="Spicy Golf" state={state} />;
  }

  if (!auth) {
    return null;
  }

  return (
    <JazzProvider
      auth={auth}
      peer={peer}
      storage="sqlite"
      AccountSchema={PlayerAccount}
      CryptoProvider={RNQuickCrypto}>
      {children}
    </JazzProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module 'jazz-react-native' {
  interface Register {
    Account: PlayerAccount;
  }
}
