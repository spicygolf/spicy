import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface ModalCloseButtonProps {
  onPress: () => void;
}

export function ModalCloseButton({ onPress }: ModalCloseButtonProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Close"
      accessibilityHint="Closes the modal"
    >
      <FontAwesome6
        name="xmark"
        iconStyle="solid"
        size={20}
        color={theme.colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create(() => ({
  button: {
    padding: 8,
    margin: -8,
  },
}));
