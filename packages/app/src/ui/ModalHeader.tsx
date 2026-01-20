import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ModalCloseButton } from "./ModalCloseButton";
import { Text } from "./Text";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

/**
 * Shared modal header component with title and close button.
 * Handles long titles by allowing text to wrap while keeping the close button aligned to the top.
 */
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ModalCloseButton onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.gap(2),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.gap(2),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
}));
