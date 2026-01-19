import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, ModalCloseButton, Text } from "@/ui";

export interface ChangeTeamsModalProps {
  visible: boolean;
  scope: "current" | "period";
  currentHoleNumber: string;
  rotateEvery: number | undefined;
  currentHoleIndex: number;
  holesListLength: number;
  onScopeChange: (scope: "current" | "period") => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ChangeTeamsModal({
  visible,
  scope,
  currentHoleNumber,
  rotateEvery,
  currentHoleIndex,
  holesListLength,
  onScopeChange,
  onConfirm,
  onCancel,
}: ChangeTeamsModalProps) {
  const { theme } = useUnistyles();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Teams</Text>
            <ModalCloseButton onPress={onCancel} />
          </View>

          <Text style={styles.modalDescription}>
            Clear team assignments and choose new teams for:
          </Text>

          <View style={styles.scopeOptions}>
            <Pressable
              style={[
                styles.scopeOption,
                scope === "current" && styles.scopeOptionSelected,
              ]}
              onPress={() => onScopeChange("current")}
            >
              <FontAwesome6
                name={scope === "current" ? "circle-dot" : "circle"}
                iconStyle="regular"
                size={20}
                color={
                  scope === "current"
                    ? theme.colors.action
                    : theme.colors.secondary
                }
              />
              <View style={styles.scopeOptionText}>
                <Text style={styles.scopeOptionLabel}>Current Hole Only</Text>
                <Text style={styles.scopeOptionDesc}>
                  Hole {currentHoleNumber}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.scopeOption,
                scope === "period" && styles.scopeOptionSelected,
              ]}
              onPress={() => onScopeChange("period")}
            >
              <FontAwesome6
                name={scope === "period" ? "circle-dot" : "circle"}
                iconStyle="regular"
                size={20}
                color={
                  scope === "period"
                    ? theme.colors.action
                    : theme.colors.secondary
                }
              />
              <View style={styles.scopeOptionText}>
                <Text style={styles.scopeOptionLabel}>
                  {rotateEvery === 0 ? "All Holes" : "Rest of Rotation Period"}
                </Text>
                <Text style={styles.scopeOptionDesc}>
                  {rotateEvery === 0
                    ? "Teams never rotate"
                    : `Holes ${currentHoleNumber} - ${Math.min(
                        Math.floor(currentHoleIndex / (rotateEvery || 1)) *
                          (rotateEvery || 1) +
                          (rotateEvery || 1),
                        holesListLength,
                      )}`}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.modalButtons}>
            <Button label="Cancel" onPress={onCancel} />
            <Button label="Change" onPress={onConfirm} />
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
  modalDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
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
