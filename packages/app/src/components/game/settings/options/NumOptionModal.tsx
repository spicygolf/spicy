import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Button, Input, ModalHeader } from "@/ui";
import { CustomizePerHoleRow } from "./CustomizePerHoleRow";

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

  inputContainer: {
    gap: theme.gap(2),
  },
  buttonContainer: {
    alignSelf: "flex-end",
  },
}));
