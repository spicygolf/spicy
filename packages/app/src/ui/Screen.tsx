import type React from "react";
import type { ViewStyle } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Screen({ children, style }: Props) {
  return <View style={[styles.v, style]}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  v: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.gap(1),
  },
}));
