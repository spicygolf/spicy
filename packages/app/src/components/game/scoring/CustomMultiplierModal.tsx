import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, Text, TextInput } from "@/ui";

interface CustomMultiplierModalProps {
  visible: boolean;
  currentValue: number | null;
  onSet: (value: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function CustomMultiplierModal({
  visible,
  currentValue,
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

  const handleSet = (): void => {
    const numValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numValue) || numValue < 1 || numValue > 1000) {
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Custom Multiplier</Text>
            <Pressable onPress={onClose}>
              <FontAwesome6
                name="xmark"
                iconStyle="solid"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Set a custom multiplier (1-1000x) that overrides all other
            multipliers for this hole.
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter multiplier"
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.multiplierSuffix}>x</Text>
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(1.5),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  multiplierSuffix: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.multiplier,
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
