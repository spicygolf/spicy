import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface IncompleteIndicatorProps {
  /** The warning message to display when tapped */
  message: string;
  /** Optional size for the dot (default: 10) */
  size?: number;
}

/**
 * Yellow dot indicator for incomplete hole scoring.
 * Tapping shows a tooltip with the warning message.
 */
export function IncompleteIndicator({
  message,
  size = 10,
}: IncompleteIndicatorProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const { theme } = useUnistyles();

  return (
    <>
      <Pressable
        onPress={() => setTooltipVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Incomplete scoring indicator"
        accessibilityHint={message}
      >
        <View
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.colors.warning,
            },
          ]}
        />
      </Pressable>

      <Modal
        visible={tooltipVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{message}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  dot: {
    // Size and color set dynamically
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  tooltip: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.5),
    borderRadius: 8,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: "#333",
    fontSize: 14,
    textAlign: "center",
  },
}));
