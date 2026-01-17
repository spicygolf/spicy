import type React from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Screen({ children, style }: ScreenProps) {
  return <View style={[styles.v, style]}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  v: {
    flex: 1,
    padding: theme.gap(1),
  },
}));
