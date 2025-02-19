import React from 'react';
import {
  ClerkLoaded,
  ClerkProvider as ClerkProviderReactNative,
} from '@clerk/clerk-react-native';
import { CLERK_PUBLISHABLE_KEY } from '@env';

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      'Missing Publishable Key. Please set CLERK_PUBLISHABLE_KEY in your .env',
    );
  }

  return (
    <ClerkProviderReactNative
      // TODO: tokenCache={tokenCache}
      publishableKey={publishableKey}>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProviderReactNative>
  );
}
