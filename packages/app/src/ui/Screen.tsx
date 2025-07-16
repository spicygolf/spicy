import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Screen({ children, style }: Props) {
  return (
    <View style={styles.v}>
      <SafeAreaView style={[styles.sav, style]}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  sav: {
    flex: 1,
    padding: 5,
  },
  v: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
