import React from 'react';
import { useClerk } from '@clerk/clerk-react-native';
import { RNQuickCrypto } from 'jazz-react-native/crypto';
import { JazzProviderWithClerk } from 'jazz-react-native-auth-clerk';
import { PlayerAccount } from '@/schema/accounts';
import { MMKVStore } from './mmkv-store';

const auth_store = new MMKVStore();

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';
  const clerk = useClerk();

  return (
    <JazzProviderWithClerk
      sync={{ peer }}
      clerk={clerk}
      storage="sqlite"
      kvStore={auth_store}
      AccountSchema={PlayerAccount}
      CryptoProvider={RNQuickCrypto}>
      {children}
    </JazzProviderWithClerk>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module 'jazz-react-native' {
  interface Register {
    Account: PlayerAccount;
  }
}
