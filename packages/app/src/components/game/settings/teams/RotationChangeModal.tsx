import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, ModalCloseButton, Text } from "@/ui";
import type { RotationChangeOption } from "./types";
import { getRotationLabel } from "./utils";

interface RotationChangeModalProps {
  visible: boolean;
  currentRotateEvery: number | undefined;
  pendingRotateEvery: number;
  onConfirm: (option: RotationChangeOption) => void;
  onCancel: () => void;
}

export function RotationChangeModal({
  visible,
  currentRotateEvery,
  pendingRotateEvery,
  onConfirm,
  onCancel,
}: RotationChangeModalProps) {
  const { theme } = useUnistyles();
  const [selectedOption, setSelectedOption] =
    useState<RotationChangeOption>("clearExceptFirst");

  const handleConfirm = () => {
    onConfirm(selectedOption);
    setSelectedOption("clearExceptFirst");
  };

  const handleCancel = () => {
    onCancel();
    setSelectedOption("clearExceptFirst");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCancel}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rotation Frequency Changed</Text>
            <ModalCloseButton onPress={handleCancel} />
          </View>

          <Text style={styles.modalDescription}>
            You changed rotation from{" "}
            <Text style={styles.boldText}>
              "{getRotationLabel(currentRotateEvery)}"
            </Text>{" "}
            to{" "}
            <Text style={styles.boldText}>
              "{getRotationLabel(pendingRotateEvery)}"
            </Text>
            . What should we do with existing team assignments?
          </Text>

          <Text style={styles.warningText}>
            Note: Scores won't be lost - they'll use whatever team assignments
            exist when scoring each hole.
          </Text>

          <View style={styles.scopeOptions}>
            <Pressable
              style={[
                styles.scopeOption,
                selectedOption === "keep" && styles.scopeOptionSelected,
              ]}
              onPress={() => setSelectedOption("keep")}
            >
              <FontAwesome6
                name={selectedOption === "keep" ? "circle-dot" : "circle"}
                iconStyle="regular"
                size={20}
                color={
                  selectedOption === "keep"
                    ? theme.colors.action
                    : theme.colors.secondary
                }
              />
              <View style={styles.scopeOptionText}>
                <Text style={styles.scopeOptionLabel}>
                  Keep all existing assignments
                </Text>
                <Text style={styles.scopeOptionDesc}>
                  Teams stay as-is on all holes
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.scopeOption,
                selectedOption === "clearExceptFirst" &&
                  styles.scopeOptionSelected,
              ]}
              onPress={() => setSelectedOption("clearExceptFirst")}
            >
              <FontAwesome6
                name={
                  selectedOption === "clearExceptFirst"
                    ? "circle-dot"
                    : "circle"
                }
                iconStyle="regular"
                size={20}
                color={
                  selectedOption === "clearExceptFirst"
                    ? theme.colors.action
                    : theme.colors.secondary
                }
              />
              <View style={styles.scopeOptionText}>
                <Text style={styles.scopeOptionLabel}>
                  Clear all holes except hole 1
                </Text>
                <Text style={styles.scopeOptionDesc}>
                  Re-choose teams according to new rotation schedule
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.scopeOption,
                selectedOption === "clearAll" && styles.scopeOptionSelected,
              ]}
              onPress={() => setSelectedOption("clearAll")}
            >
              <FontAwesome6
                name={selectedOption === "clearAll" ? "circle-dot" : "circle"}
                iconStyle="regular"
                size={20}
                color={
                  selectedOption === "clearAll"
                    ? theme.colors.action
                    : theme.colors.secondary
                }
              />
              <View style={styles.scopeOptionText}>
                <Text style={styles.scopeOptionLabel}>Clear everything</Text>
                <Text style={styles.scopeOptionDesc}>
                  Start fresh, choose teams on hole 1
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.modalButtons}>
            <Button label="Cancel" onPress={handleCancel} />
            <Button label="Apply" onPress={handleConfirm} />
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
  modalDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  warningText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
    fontStyle: "italic",
    lineHeight: 18,
  },
  scopeOptions: {
    gap: theme.gap(1.5),
    marginBottom: theme.gap(3),
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    gap: theme.gap(1.5),
  },
  scopeOptionSelected: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  scopeOptionText: {
    flex: 1,
  },
  scopeOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
  },
  scopeOptionDesc: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.gap(1.5),
  },
}));
