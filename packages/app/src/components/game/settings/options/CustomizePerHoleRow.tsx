import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface CustomizePerHoleRowProps {
  /** Whether per-hole overrides are active for this option */
  hasOverrides?: boolean;
  /** Close the parent modal before navigating */
  onClose: () => void;
  /** Navigate to per-hole customization */
  onCustomize: () => void;
}

/**
 * "Customize per hole" link row shown at the bottom of option modals.
 *
 * Closes the modal and navigates to the HoleOverrides screen.
 * Highlights in the action color when overrides already exist.
 */
export function CustomizePerHoleRow({
  hasOverrides,
  onClose,
  onCustomize,
}: CustomizePerHoleRowProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      style={styles.customizeRow}
      onPress={() => {
        onClose();
        onCustomize();
      }}
    >
      <FontAwesome6
        name="sliders"
        iconStyle="solid"
        size={14}
        color={hasOverrides ? theme.colors.action : theme.colors.secondary}
      />
      <Text
        style={[
          styles.customizeText,
          hasOverrides && { color: theme.colors.action },
        ]}
      >
        Customize per hole
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  customizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.75),
    marginTop: theme.gap(2),
    paddingTop: theme.gap(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  customizeText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
