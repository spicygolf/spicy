import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { resetSpecFromRef } from "spicylib/scoring";
import { useGame } from "@/hooks";
import { Text } from "@/ui";

/**
 * Button to reset a game's spec (options) back to catalog defaults.
 *
 * Uses the game's specRef (catalog spec) to restore all options
 * to their original values, reverting any user customizations.
 */
export function ResetSpecButton() {
  const { theme } = useUnistyles();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      specRef: { $each: true },
    },
  });

  const canReset =
    game?.$isLoaded &&
    game.$jazz.has("spec") &&
    game.$jazz.has("specRef") &&
    game.spec?.$isLoaded &&
    game.specRef?.$isLoaded;

  const handleReset = () => {
    setError(null);
    setSuccess(false);

    if (!game?.$isLoaded) {
      setError("Game not loaded. Please try again.");
      return;
    }
    if (!game.$jazz.has("spec") || !game.$jazz.has("specRef")) {
      setError("Game spec not loaded. Please try again.");
      return;
    }

    try {
      if (!game.spec?.$isLoaded || !game.specRef?.$isLoaded) {
        setError("Specs not fully loaded. Please try again.");
        return;
      }
      const count = resetSpecFromRef(game.spec, game.specRef);
      if (count > 0) {
        setSuccess(true);
        // Close modal after short delay to show success
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError("No options to reset.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset. Please try again.",
      );
    }
  };

  return (
    <>
      <Pressable
        style={styles.button}
        onPress={() => setShowModal(true)}
        disabled={!canReset}
        testID="reset-spec-button"
      >
        <View style={styles.buttonLeft}>
          <FontAwesome6
            name="rotate-left"
            iconStyle="solid"
            size={12}
            color={theme.colors.action}
          />
          <Text style={styles.buttonText}>Reset Options to Defaults</Text>
        </View>
        <FontAwesome6
          name="chevron-right"
          iconStyle="solid"
          size={14}
          color={theme.colors.action}
        />
      </Pressable>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
          accessible={false}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
            accessible={false}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Options</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <FontAwesome6
                  name="xmark"
                  iconStyle="solid"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>
              Reset all game options to their defaults? This will revert any
              customizations you've made.
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <FontAwesome6
                  name="circle-exclamation"
                  iconStyle="solid"
                  size={16}
                  color={theme.colors.error}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successBox}>
                <FontAwesome6
                  name="circle-check"
                  iconStyle="solid"
                  size={16}
                  color={theme.colors.success}
                />
                <Text style={styles.successText}>
                  Options reset successfully!
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
                testID="reset-spec-cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={handleReset}
                disabled={success}
                testID="reset-spec-confirm"
                accessible={true}
              >
                <Text style={styles.confirmButtonText}>Reset</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.75),
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.action,
  },
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
    color: theme.colors.action,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.gap(2),
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.gap(1),
    backgroundColor: `${theme.colors.error}15`,
    padding: theme.gap(1.5),
    borderRadius: 8,
    marginBottom: theme.gap(2),
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    lineHeight: 20,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.gap(1),
    backgroundColor: `${theme.colors.success}15`,
    padding: theme.gap(1.5),
    borderRadius: 8,
    marginBottom: theme.gap(2),
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.success,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1.5),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(2),
    backgroundColor: theme.colors.action,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
}));
