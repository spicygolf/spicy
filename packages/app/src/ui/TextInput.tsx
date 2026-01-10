/**
 * Themed TextInput component
 *
 * A styled drop-in replacement for React Native's TextInput with theme support.
 * Supports all RN TextInput props plus additional styling options.
 */

import type { TextInputProps as RNTextInputProps } from "react-native";
// biome-ignore lint/style/noRestrictedImports: This is the themed wrapper for RN TextInput
import { TextInput as RNTextInput } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface TextInputProps extends RNTextInputProps {
  /** Apply error styling */
  hasError?: boolean;
}

export function TextInput({ style, hasError, ...props }: TextInputProps) {
  const { theme } = useUnistyles();

  return (
    <RNTextInput
      style={[styles.input, hasError && styles.inputError, style]}
      placeholderTextColor={theme.colors.secondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  input: {
    borderRadius: theme.gap(0.75),
    borderWidth: 0.75,
    borderColor: theme.colors.secondary,
    padding: theme.gap(1),
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
}));
