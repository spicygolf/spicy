import React, { StrictMode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigators/RootNavigator';
import { ClerkProvider } from '@/providers/clerk';
import { JazzAndAuth } from '@/providers/jazz';
import { NavigationProvider } from '@/providers/navigation';

export function App() {
  return (
    <StrictMode>
      <SafeAreaProvider>
        <ClerkProvider>
          <JazzAndAuth>
            <NavigationProvider>
              <RootNavigator />
            </NavigationProvider>
          </JazzAndAuth>
        </ClerkProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
