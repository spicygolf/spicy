import React from 'react';
import {
  DemoAuthBasicUI,
  JazzProvider,
  useDemoAuth,
  clearUserCredentials,
} from 'jazz-react-native';
import { PlayerAccount } from '@/schema/accounts';
import { MMKVStore } from './mmkv-store';

const auth_store = new MMKVStore();

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  // blow everything away
  if (false) {
    auth_store.clearAll();
    clearUserCredentials();
  }

  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';
  const [auth, state] = useDemoAuth({ store: auth_store });
  if (!auth) {
    return null;
  }
  console.log({ auth, state });

  if (state.state !== 'signedIn') {
    return <DemoAuthBasicUI appName="Spicy Golf" state={state} />;
  }

  return (
    <JazzProvider
      auth={auth}
      peer={peer}
      AccountSchema={PlayerAccount}
      storage="sqlite">
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
