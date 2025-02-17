import React from 'react';
import { JazzProvider, RNQuickCrypto } from 'jazz-react-native';
import { PlayerAccount } from '@/schema/accounts';
import { MMKVStore } from './mmkv-store';

const auth_store = new MMKVStore();

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';
  return (
    <JazzProvider
      sync={{ peer }}
      storage="sqlite"
      kvStore={auth_store}
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
