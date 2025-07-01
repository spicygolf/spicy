import React, { StrictMode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigators/RootNavigator';
import { JazzAndAuth } from '@/providers/jazz';
import { NavigationProvider } from '@/providers/navigation';

export function App() {
  return (
    <StrictMode>
      <SafeAreaProvider>
        <JazzAndAuth>
          <NavigationProvider>
            <RootNavigator />
          </NavigationProvider>
        </JazzAndAuth>
      </SafeAreaProvider>
    </StrictMode>
  );
}
