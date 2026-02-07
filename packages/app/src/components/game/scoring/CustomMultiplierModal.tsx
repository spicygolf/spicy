import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, ModalHeader, Text, TextInput } from "@/ui";

interface CustomMultiplierModalProps {
  visible: boolean;
  currentValue: number | null;
  /** Maximum allowed value (from max_off_tee game option). Null means no cap. */
  maxValue: number | null;
  onSet: (value: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function CustomMultiplierModal({
  visible,
  currentValue,
  maxValue,
  onSet,
  onClear,
  onClose,
}: CustomMultiplierModalProps): React.ReactElement {
  const { theme } = useUnistyles();
  const [inputValue, setInputValue] = useState(
    currentValue ? String(currentValue) : "",
  );

  // Sync input state when modal opens or currentValue changes
  useEffect(() => {
    if (visible) {
      setInputValue(currentValue ? String(currentValue) : "");
    }
  }, [visible, currentValue]);

  const upperLimit = maxValue && maxValue > 0 ? maxValue : 1000;

  const handleSet = (): void => {
    const numValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numValue) || numValue < 1 || numValue > upperLimit) {
      return;
    }
    onSet(numValue);
    onClose();
  };

  const handleClear = (): void => {
    onClear();
    onClose();
  };

  const isActive = currentValue !== null && currentValue > 0;

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
          <ModalHeader title="Custom Tee Multiplier" onClose={onClose} />

          <Text style={styles.description}>
            Set a custom "off the tee" multiplier (1-{upperLimit}x). This
            replaces pre-presses and doubles, but earned multipliers (birdie
            BBQ, etc.) still stack on top.
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={inputValue}
                onChangeText={(text) =>
                  setInputValue(text.replace(/[^0-9]/g, ""))
                }
                placeholder="Enter multiplier"
                autoFocus
                selectTextOnFocus
              />
            </View>

            <View style={styles.buttonRow}>
              {isActive && (
                <Pressable style={styles.clearButton} onPress={handleClear}>
                  <Text
                    style={[
                      styles.clearButtonText,
                      { color: theme.colors.error },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              )}
              <Button label="Set" onPress={handleSet} />
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
    maxWidth: 320,
  },

  description: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
  },
  inputContainer: {
    gap: theme.gap(2),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.gap(1),
  },
  clearButton: {
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
}));
