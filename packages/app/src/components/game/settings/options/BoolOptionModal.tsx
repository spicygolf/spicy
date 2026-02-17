import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { ModalHeader, Text } from "@/ui";
import { CustomizePerHoleRow } from "./CustomizePerHoleRow";

interface BoolOptionModalProps {
  visible: boolean;
  option: GameOption;
  currentValue: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** Navigate to per-hole customization */
  onCustomize?: () => void;
  /** Whether per-hole overrides are active for this option */
  hasOverrides?: boolean;
}

export function BoolOptionModal({
  visible,
  option,
  currentValue,
  onSelect,
  onClose,
  onCustomize,
  hasOverrides,
}: BoolOptionModalProps) {
  const value = currentValue ?? option.defaultValue;

  const options = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ];

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
          <ModalHeader title={option.disp ?? ""} onClose={onClose} />

          <View style={styles.options}>
            {options.map((opt) => {
              const isSelected = value === opt.value;

              return (
                <Pressable
                  key={opt.value}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {onCustomize && (
            <CustomizePerHoleRow
              hasOverrides={hasOverrides}
              onClose={onClose}
              onCustomize={onCustomize}
            />
          )}
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
    maxWidth: 400,
  },

  options: {
    gap: theme.gap(1.5),
  },
  option: {
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  optionSelected: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  optionLabelSelected: {
    color: theme.colors.action,
  },
}));
