import { TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function Button({ label, onPress, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 10,
    backgroundColor: theme.colors.action,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.actionText,
  },
  disabledText: {
    color: theme.colors.secondary,
  },
}));
