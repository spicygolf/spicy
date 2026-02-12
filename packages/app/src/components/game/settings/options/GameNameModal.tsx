import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, Input, ModalHeader } from "@/ui";

interface GameNameModalProps {
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

/**
 * Modal for editing the game name.
 * Parent must conditionally render this component so that useState
 * re-initializes from currentName on each mount.
 */
export function GameNameModal({
  currentName,
  onSave,
  onClose,
}: GameNameModalProps) {
  const [inputValue, setInputValue] = useState(currentName);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    if (trimmed === "") {
      return;
    }
    onClose();
    onSave(trimmed);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <ModalHeader title="Edit Game Name" onClose={onClose} />

          <View style={styles.inputContainer}>
            <Input
              label="Game Name"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter game name"
            />
            <View style={styles.buttonContainer}>
              <Button label="Save" onPress={handleSave} />
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
