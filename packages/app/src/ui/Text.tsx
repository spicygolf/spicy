import type React from "react";
import type { TextStyle } from "react-native";
// biome-ignore lint/style/noRestrictedImports: This component is a wrapper around the React Native component.
import { Text as RNText } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  children: React.ReactNode;
  style?: TextStyle;
};

export function Text({ children, style }: Props) {
  return <RNText style={[styles.text, style]}>{children}</RNText>;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.primary,
  },
}));
