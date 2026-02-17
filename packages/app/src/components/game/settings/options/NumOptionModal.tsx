import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Button, Input, ModalHeader, Text } from "@/ui";

interface NumOptionModalProps {
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

export function NumOptionModal({
  visible,
  option,
  currentValue,
  onSelect,
  onClose,
  onCustomize,
  hasOverrides,
}: NumOptionModalProps) {
  const { theme } = useUnistyles();
  const value = currentValue ?? option.defaultValue;
  const [inputValue, setInputValue] = useState(value);

  const handleSubmit = () => {
    const numValue = Number.parseFloat(inputValue);
    if (Number.isNaN(numValue)) {
      return;
    }
    onSelect(inputValue);
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
          <ModalHeader title={option.disp ?? ""} onClose={onClose} />

          <View style={styles.inputContainer}>
            <Input
              label={option.disp}
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter value"
            />
            <View style={styles.buttonContainer}>
              <Button label="Set" onPress={handleSubmit} />
            </View>
          </View>

          {onCustomize && (
            <Pressable
              style={styles.customizeRow}
              onPress={() => {
                onClose();
                onCustomize();
              }}
            >
              <FontAwesome6
                name="sliders"
                iconStyle="solid"
                size={14}
                color={
                  hasOverrides ? theme.colors.action : theme.colors.secondary
                }
              />
              <Text
                style={[
                  styles.customizeText,
                  hasOverrides && { color: theme.colors.action },
                ]}
              >
                Customize per hole
              </Text>
            </Pressable>
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

  inputContainer: {
    gap: theme.gap(2),
  },
  buttonContainer: {
    alignSelf: "flex-end",
  },
  customizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.75),
    marginTop: theme.gap(2),
    paddingTop: theme.gap(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  customizeText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
