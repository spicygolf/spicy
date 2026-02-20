import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { JunkOption } from "spicylib/schema";
import { ModalHeader, Text } from "@/ui";

interface JunkValueModalProps {
  visible: boolean;
  option: JunkOption;
  onSave: (option: JunkOption, newValue: number) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function JunkValueModal({
  visible,
  option,
  onSave,
  onRemove,
  onClose,
}: JunkValueModalProps) {
  const { theme } = useUnistyles();
  const [value, setValue] = useState(option.value);

  const handleIncrement = () => setValue((v) => v + 1);
  const handleDecrement = () => setValue((v) => Math.max(0, v - 1));

  const handleSave = () => {
    if (value !== option.value) {
      onSave(option, value);
    }
    onClose();
  };

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
          <ModalHeader title={option.disp} onClose={onClose} />

          {/* Point value editor */}
          <View style={styles.valueSection}>
            <Text style={styles.valueLabel}>Point Value</Text>
            <View style={styles.stepper}>
              <Pressable
                style={[
                  styles.stepperButton,
                  value <= 0 && styles.stepperButtonDisabled,
                ]}
                onPress={handleDecrement}
                disabled={value <= 0}
                hitSlop={8}
              >
                <FontAwesome6
                  name="minus"
                  iconStyle="solid"
                  size={14}
                  color={
                    value <= 0 ? theme.colors.border : theme.colors.primary
                  }
                />
              </Pressable>
              <Text style={styles.valueText}>
                {value} {value === 1 ? "pt" : "pts"}
              </Text>
              <Pressable
                style={styles.stepperButton}
                onPress={handleIncrement}
                hitSlop={8}
              >
                <FontAwesome6
                  name="plus"
                  iconStyle="solid"
                  size={14}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable style={styles.actionRow} onPress={handleSave}>
              <FontAwesome6
                name="circle-check"
                iconStyle="solid"
                size={16}
                color={theme.colors.action}
              />
              <Text style={styles.actionText}>
                {value !== option.value ? "Save changes" : "Keep in game"}
              </Text>
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
    padding: theme.gap(2),
  },
  valueSection: {
    alignItems: "center",
    paddingVertical: theme.gap(2),
    gap: theme.gap(1),
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.secondary,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    minWidth: 60,
    textAlign: "center",
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.gap(0.5),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
    paddingVertical: theme.gap(1.25),
    paddingHorizontal: theme.gap(0.5),
  },
  actionText: {
    fontSize: 15,
    color: theme.colors.primary,
  },
  removeText: {
    color: theme.colors.error,
  },
}));
