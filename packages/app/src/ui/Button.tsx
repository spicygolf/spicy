import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  variant?: "primary" | "secondary";
}

export function Button({
  label,
  onPress,
  disabled,
  testID,
  variant = "primary",
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === "secondary" && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text
        style={[styles.text, variant === "secondary" && styles.secondaryText]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 12,
    backgroundColor: theme.colors.action,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.actionText,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
}));
