import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, Input, Text } from "@/ui";
import { getRotationLabel, ROTATION_OPTIONS } from "./utils";

interface RotationFrequencyPickerProps {
  rotateEvery: number | undefined;
  onRotationChange: (value: number) => void;
}

export function RotationFrequencyPicker({
  rotateEvery,
  onRotationChange,
}: RotationFrequencyPickerProps) {
  const { theme } = useUnistyles();
  const [showRotationPicker, setShowRotationPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customRotateValue, setCustomRotateValue] = useState<string>("");

  const handleRotationChange = (value: number) => {
    if (value === -1) {
      setShowCustomInput(true);
      return;
    }
    setShowCustomInput(false);
    onRotationChange(value);
    setShowRotationPicker(false);
  };

  const handleCustomRotateSubmit = () => {
    const numValue = Number.parseInt(customRotateValue, 10);
    if (Number.isNaN(numValue) || numValue < 0) {
      return;
    }

    onRotationChange(numValue);
    setShowCustomInput(false);
    setShowRotationPicker(false);
    setCustomRotateValue("");
  };

  const handleClose = () => {
    setShowRotationPicker(false);
    setShowCustomInput(false);
  };

  const isCustomValue =
    rotateEvery !== undefined &&
    rotateEvery !== 0 &&
    rotateEvery !== 1 &&
    rotateEvery !== 3 &&
    rotateEvery !== 6;

  const styles = useStyles;

  return (
    <>
      {/* Compact Rotation Picker Row */}
      <Pressable
        style={styles.rotationPickerRow}
        onPress={() => setShowRotationPicker(true)}
      >
        <Text style={styles.rotationPickerLabel}>Teams Rotate:</Text>
        <View style={styles.rotationPickerValue}>
          <Text style={styles.rotationPickerValueText}>
            {getRotationLabel(rotateEvery)}
          </Text>
          <FontAwesome6
            name="chevron-right"
            iconStyle="solid"
            size={14}
            color={theme.colors.secondary}
          />
        </View>
      </Pressable>

      {/* Rotation Picker Modal */}
      <Modal
        visible={showRotationPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Teams Rotate</Text>
              <Pressable onPress={handleClose}>
                <FontAwesome6
                  name="xmark"
                  iconStyle="solid"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            <View style={styles.rotationOptions}>
              {ROTATION_OPTIONS.map((option) => {
                const isSelected =
                  option.value === -1
                    ? showCustomInput
                    : rotateEvery === option.value;

                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.rotationOption,
                      (isSelected || (option.value === -1 && isCustomValue)) &&
                        styles.rotationOptionSelected,
                    ]}
                    onPress={() => handleRotationChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.rotationOptionLabel,
                        (isSelected ||
                          (option.value === -1 && isCustomValue)) &&
                          styles.rotationOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                      {option.value === -1 &&
                        isCustomValue &&
                        ` (${rotateEvery})`}
                    </Text>
                    <Text
                      style={[
                        styles.rotationOptionDesc,
                        (isSelected ||
                          (option.value === -1 && isCustomValue)) &&
                          styles.rotationOptionDescSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <View style={styles.customInputRow}>
                  <Input
                    label="Rotation frequency (holes)"
                    keyboardType="number-pad"
                    value={customRotateValue}
                    onChangeText={setCustomRotateValue}
                    placeholder="e.g., 9"
                  />
                  <View style={styles.customInputButton}>
                    <Button label="Set" onPress={handleCustomRotateSubmit} />
                  </View>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = StyleSheet.create((theme) => ({
  rotationPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  rotationPickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  rotationPickerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  rotationPickerValueText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
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
  rotationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.gap(1.5),
  },
  rotationOption: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  rotationOptionSelected: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  rotationOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  rotationOptionLabelSelected: {
    color: theme.colors.action,
  },
  rotationOptionDesc: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  rotationOptionDescSelected: {
    color: theme.colors.action,
  },
  customInputContainer: {
    marginTop: theme.gap(2),
    padding: theme.gap(2),
    backgroundColor: `${theme.colors.action}05`,
    borderRadius: 8,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.gap(1),
  },
  customInputButton: {
    marginBottom: theme.gap(1.25),
  },
}));
