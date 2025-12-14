import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Button, Input, Text } from "@/ui";

interface NumOptionModalProps {
  visible: boolean;
  option: GameOption;
  currentValue: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function NumOptionModal({
  visible,
  option,
  currentValue,
  onSelect,
  onClose,
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
  inputContainer: {
    gap: theme.gap(2),
  },
  buttonContainer: {
    alignSelf: "flex-end",
  },
}));
