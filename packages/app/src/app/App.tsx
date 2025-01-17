import React, { StrictMode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigators/AppNavigator';
import { JazzAndAuth } from '@/providers/jazz';
import { NavigationProvider } from '@/providers/navigation';

export default function App() {
  return (
    <StrictMode>
      <SafeAreaProvider>
        <JazzAndAuth>
          <NavigationProvider>
            <AppNavigator />
          </NavigationProvider>
        </JazzAndAuth>
      </SafeAreaProvider>
    </StrictMode>
  );
}
