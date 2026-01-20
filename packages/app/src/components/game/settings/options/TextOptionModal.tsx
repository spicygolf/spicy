import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Button, Input, ModalHeader } from "@/ui";

interface TextOptionModalProps {
  visible: boolean;
  option: GameOption;
  currentValue: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function TextOptionModal({
  visible,
  option,
  currentValue,
  onSelect,
  onClose,
}: TextOptionModalProps) {
  const value = currentValue ?? option.defaultValue;
  const [inputValue, setInputValue] = useState(value);

  const handleSubmit = () => {
    if (inputValue.trim() === "") {
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
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter value"
            />
            <View style={styles.buttonContainer}>
              <Button label="Set" onPress={handleSubmit} />
            </View>
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

  inputContainer: {
    gap: theme.gap(2),
  },
  buttonContainer: {
    alignSelf: "flex-end",
  },
}));
