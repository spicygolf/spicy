import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { JunkOption, MultiplierOption } from "spicylib/schema";
import { Text } from "@/ui";

type RemovableOption = JunkOption | MultiplierOption;

interface RemoveOptionModalProps {
  visible: boolean;
  option: RemovableOption | null;
  onRemove: () => void;
  onClose: () => void;
}

export function RemoveOptionModal({
  visible,
  option,
  onRemove,
  onClose,
}: RemoveOptionModalProps) {
  const { theme } = useUnistyles();

  if (!option) return null;

  const isJunk = option.type === "junk";
  const typeLabel = isJunk ? "Junk" : "Multiplier";

  const valueDisplay = isJunk
    ? `${(option as JunkOption).value} ${(option as JunkOption).value === 1 ? "point" : "points"}`
    : (option as MultiplierOption).value
      ? `${(option as MultiplierOption).value}x multiplier`
      : "variable multiplier";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{option.disp}</Text>
            <Pressable onPress={onClose}>
              <FontAwesome6
                name="xmark"
                iconStyle="solid"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{typeLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Value:</Text>
              <Text style={styles.infoValue}>{valueDisplay}</Text>
            </View>
            {option.scope && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scope:</Text>
                <Text style={styles.infoValue}>{option.scope}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Keep</Text>
            </Pressable>
            <Pressable style={styles.removeButton} onPress={onRemove}>
              <FontAwesome6
                name="trash-can"
                iconStyle="solid"
                size={14}
                color="#fff"
              />
              <Text style={styles.removeButtonText}>Remove from Game</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(1.5),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  infoSection: {
    marginBottom: theme.gap(2),
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.gap(0.5),
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.gap(1.25),
    paddingHorizontal: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    gap: theme.gap(0.75),
    paddingVertical: theme.gap(1.25),
    paddingHorizontal: theme.gap(1.5),
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
}));
