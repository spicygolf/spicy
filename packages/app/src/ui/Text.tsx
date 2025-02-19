import React from 'react';
import { Text as RNText } from 'react-native';
import type { TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  children: React.ReactNode;
  style?: TextStyle;
};

export function Text({ children, style }: Props) {
  return <RNText style={[styles.text, style]}>{children}</RNText>;
}

const styles = StyleSheet.create(theme => ({
  text: {
    color: theme.colors.primary,
  },
}));
