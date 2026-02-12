import { Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, Text } from "@/ui";

interface TeeFlipConfirmModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Label text for the confirmation question (e.g. "Flip for presses") */
  label: string;
  /** Called when user confirms (taps "Yes") */
  onConfirm: () => void;
  /** Called when user declines (taps "No") */
  onDecline: () => void;
}

/**
 * Confirmation modal asking whether to perform a tee flip.
 *
 * Shown when the score is tied and the game has a tee_flip option enabled.
 * Follows the TeeFlipModal unmount pattern (returns null when not visible)
 * to avoid Jazz progressive loading oscillation.
 */
export function TeeFlipConfirmModal({
  visible,
  label,
  onConfirm,
  onDecline,
}: TeeFlipConfirmModalProps): React.ReactElement | null {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Score is tied</Text>
          <Text style={styles.message}>{label}?</Text>
          <View style={styles.buttons}>
            <View style={styles.button}>
              <Button label="No" variant="secondary" onPress={onDecline} />
            </View>
            <View style={styles.button}>
              <Button label="Yes" onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(3),
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.gap(1),
  },
  message: {
    fontSize: 16,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: theme.gap(3),
  },
  buttons: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  button: {
    flex: 1,
  },
}));
