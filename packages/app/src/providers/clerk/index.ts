import type React from 'react';
// import {
//   ClerkLoaded,
//   ClerkProvider,
//   SecureTokenCache,
// } from '@clerk/clerk-react-native';
import { CLERK_PUBLISHABLE_KEY } from '@env';

export function ClerkProviderReactNative({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      'Missing Publishable Key. Please set CLERK_PUBLISHABLE_KEY in your .env',
    );
  }

  // return (
  //   <ClerkProvider
  //     tokenCache={SecureTokenCache}
  //     publishableKey={publishableKey}>
  //     <ClerkLoaded>{children}</ClerkLoaded>
  //   </ClerkProvider>
  // );

  return children;
}
