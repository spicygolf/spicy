import React from 'react';
import { useIsAuthenticated } from 'jazz-react-native';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
