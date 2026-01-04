import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface HoleToolbarProps {
  onChangeTeams?: () => void;
  /** Overall multiplier for the hole (1x, 2x, 4x, 8x, etc.) */
  overallMultiplier?: number;
  /** Whether explain mode is enabled (for future use) */
  explainMode?: boolean;
  onToggleExplain?: () => void;
}

export function HoleToolbar({
  onChangeTeams,
  overallMultiplier = 1,
  explainMode = false,
  onToggleExplain,
}: HoleToolbarProps) {
  const { theme } = useUnistyles();

  // Format multiplier display (1x, 2x, 4x, 8x)
  const multiplierText = `${overallMultiplier}x`;
  const isActive = overallMultiplier > 1;

  return (
    <View style={styles.container}>
      {/* Left: Team chooser icon */}
      <View style={styles.leftSection}>
        {onChangeTeams && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onChangeTeams}
            accessibilityLabel="Change teams"
          >
            <FontAwesome6
              name="people-group"
              iconStyle="solid"
              size={24}
              color={theme.colors.action}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Overall multiplier display */}
      <View style={styles.centerSection}>
        {isActive && (
          <View style={styles.multiplierBadge}>
            <Text
              style={[
                styles.multiplierText,
                { color: theme.colors.multiplier },
              ]}
            >
              {multiplierText}
            </Text>
          </View>
        )}
      </View>

      {/* Right: Explain mode icon (disabled/placeholder) */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            (!onToggleExplain || !explainMode) && styles.iconButtonInactive,
          ]}
          onPress={onToggleExplain}
          disabled={!onToggleExplain}
          accessibilityLabel="Explain mode (coming soon)"
        >
          <FontAwesome6
            name="circle-question"
            iconStyle="solid"
            size={24}
            color={explainMode ? theme.colors.action : theme.colors.border}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  iconButton: {
    padding: theme.gap(0.5),
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonInactive: {
    opacity: 0.3,
  },
  multiplierBadge: {
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(0.5),
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: "bold",
  },
}));
