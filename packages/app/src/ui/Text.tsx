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
  testID?: string;
}

export function Text({
  children,
  style,
  numberOfLines,
  ellipsizeMode,
  testID,
}: TextProps) {
  return (
    <RNText
      style={[styles.text, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      testID={testID}
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
