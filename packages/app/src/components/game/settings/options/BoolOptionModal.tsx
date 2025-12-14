import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Text } from "@/ui";

interface BoolOptionModalProps {
  visible: boolean;
  option: GameOption;
  currentValue: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function BoolOptionModal({
  visible,
  option,
  currentValue,
  onSelect,
  onClose,
}: BoolOptionModalProps) {
  const { theme } = useUnistyles();
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
