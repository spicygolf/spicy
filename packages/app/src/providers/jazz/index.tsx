import React from 'react';
import { AuthProvider } from 'jazz-react-auth-betterauth';
import { JazzReactNativeProvider } from 'jazz-tools/react-native';
// import { RNQuickCrypto } from 'jazz-tools/react-native-core/crypto';
import { PlayerAccount } from '@/schema/accounts';

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer = 'wss://cloud.jazz.tools/?key=spicy.dev@druid.golf';

  return (
    <JazzReactNativeProvider
      sync={{ peer }}
      AccountSchema={PlayerAccount}
      // CryptoProvider={RNQuickCrypto}
    >
      <AuthProvider
        options={{
          baseURL: 'http://localhost:3040/v4/auth/',
        }}
      >
        {children}
      </AuthProvider>
    </JazzReactNativeProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module 'jazz-tools/react-native' {
  interface Register {
    Account: PlayerAccount;
  }
}
