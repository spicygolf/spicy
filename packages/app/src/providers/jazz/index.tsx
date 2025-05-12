import React from 'react';
import { JazzProvider } from 'jazz-react-native';
// import { RNQuickCrypto } from 'jazz-react-native-core/crypto';
import { PlayerAccount } from '@/schema/accounts';

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';

  return (
    <JazzProvider
      sync={{ peer }}
      AccountSchema={PlayerAccount}
      // CryptoProvider={RNQuickCrypto}
    >
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
