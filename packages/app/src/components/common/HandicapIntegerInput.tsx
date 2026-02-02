/**
 * Handicap integer input component for course/game handicaps.
 *
 * Supports formats like "10" or "+2" for plus handicaps.
 * No decimals allowed - use HandicapIndexInput for index values.
 */

import type { TextInputProps } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text, TextInput } from "@/ui";

/**
 * Filter input to only allow valid game/course handicap characters.
 * Allows optional leading + (for plus handicaps), and digits only (integers).
 */
export function filterHandicapIntegerInput(input: string): string {
  // Remove any invalid characters, keeping only + and digits
  let filtered = input.replace(/[^+\d]/g, "");
  // Only allow + at the start
  if (filtered.indexOf("+") > 0) {
    filtered = filtered.replace(/\+/g, "");
  }
  return filtered;
}

interface HandicapIntegerInputProps
  extends Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> {
  /** Current value */
  value: string;
  /** Called when value changes (already filtered) */
  onChangeText: (value: string) => void;
  /** Optional label above the input */
  label?: string;
  /** Optional helper text below the input */
  helperText?: string;
  /** Error message to display */
  error?: string;
}

export function HandicapIntegerInput({
  value,
  onChangeText,
  label,
  helperText,
  error,
  placeholder = "e.g., 10 or +2",
  ...rest
}: HandicapIntegerInputProps): React.ReactElement {
  const handleChangeText = (text: string): void => {
    onChangeText(filterHandicapIntegerInput(text));
  };

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        keyboardType="default"
        hasError={!!error}
        {...rest}
      />
      {helperText && !error ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  label: {
    color: theme.colors.secondary,
    fontSize: 10,
    marginBottom: 3,
  },
  helperText: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginTop: 3,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 3,
  },
}));
