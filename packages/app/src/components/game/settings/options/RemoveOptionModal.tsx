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

  const valueDisplay = isJunk
    ? `${(option as JunkOption).value} ${(option as JunkOption).value === 1 ? "pt" : "pts"}`
    : (option as MultiplierOption).value
      ? `${(option as MultiplierOption).value}x`
      : "variable";

  const scopeDisplay = option.scope || "–";

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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>{option.disp}</Text>
              <Text style={styles.modalSubtitle}>
                {isJunk ? "Junk" : "Multiplier"} · {valueDisplay} ·{" "}
                {scopeDisplay}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <FontAwesome6
                name="xmark"
                iconStyle="solid"
                size={18}
                color={theme.colors.secondary}
              />
            </Pressable>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable style={styles.actionRow} onPress={onClose}>
              <FontAwesome6
                name="circle-check"
                iconStyle="solid"
                size={16}
                color={theme.colors.action}
              />
              <Text style={styles.actionText}>Keep in game</Text>
            </Pressable>

            <Pressable style={styles.actionRow} onPress={onRemove}>
              <FontAwesome6
                name="trash-can"
                iconStyle="solid"
                size={16}
                color={theme.colors.error}
              />
              <Text style={[styles.actionText, styles.removeText]}>
                Remove from game
              </Text>
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
    padding: theme.gap(3),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    width: "100%",
    maxWidth: 300,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flex: 1,
    marginRight: theme.gap(1),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  actionsContainer: {
    paddingVertical: theme.gap(0.5),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    paddingVertical: theme.gap(1.25),
    paddingHorizontal: theme.gap(1.5),
  },
  actionText: {
    fontSize: 15,
    color: theme.colors.primary,
  },
  removeText: {
    color: theme.colors.error,
  },
}));
