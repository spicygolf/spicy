/**
 * Handicap Index input component with validation for plus handicaps and decimals.
 *
 * Supports formats like "12.5" or "+2.3" for plus handicaps.
 * Use this for handicap index fields where decimal precision is needed.
 */

import type { TextInputProps } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text, TextInput } from "@/ui";

/**
 * Filter input to only allow valid handicap index characters.
 * Allows optional leading + (for plus handicaps), digits, and one decimal point.
 */
export function filterHandicapIndexInput(input: string): string {
  // Remove any invalid characters, keeping only +, digits, and decimal point
  let filtered = input.replace(/[^+\d.]/g, "");
  // Only allow + at the start
  if (filtered.indexOf("+") > 0) {
    filtered = filtered.replace(/\+/g, "");
  }
  // Only allow one decimal point
  const parts = filtered.split(".");
  if (parts.length > 2) {
    filtered = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return filtered;
}

interface HandicapIndexInputProps
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

export function HandicapIndexInput({
  value,
  onChangeText,
  label,
  helperText,
  error,
  placeholder = "e.g., 12.5 or +2.3",
  ...rest
}: HandicapIndexInputProps): React.ReactElement {
  const handleChangeText = (text: string): void => {
    onChangeText(filterHandicapIndexInput(text));
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
