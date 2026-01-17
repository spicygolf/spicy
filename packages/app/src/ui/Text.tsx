import type React from "react";
import type { StyleProp, TextStyle } from "react-native";
// biome-ignore lint/style/noRestrictedImports: This component is a wrapper around the React Native component.
import { Text as RNText } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface TextProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
}

export function Text({
  children,
  style,
  numberOfLines,
  ellipsizeMode,
}: TextProps) {
  return (
    <RNText
      style={[styles.text, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.primary,
  },
}));
