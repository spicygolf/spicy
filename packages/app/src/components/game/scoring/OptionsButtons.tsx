import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

/**
 * Map legacy/custom icon names to FontAwesome6 icons
 */
function mapIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    album: "bullseye", // prox (closest to pin)
    // Add more mappings as needed
  };
  return iconMap[icon] ?? icon;
}

export interface OptionButton {
  name: string;
  displayName: string;
  icon?: string;
  type: "junk" | "multiplier";
  selected: boolean;
  /**
   * If true, this option was activated on a previous hole and is still in effect.
   * Inherited options are shown as selected but dimmed and disabled.
   */
  inherited?: boolean;
  /**
   * If true, this is a calculated/automatic junk (e.g., birdie, eagle, low_ball).
   * Calculated junk is shown as selected but cannot be toggled by the user.
   * based_on: "gross", "net", or "logic" (not "user")
   */
  calculated?: boolean;
}

interface OptionsButtonsProps {
  options: OptionButton[];
  onOptionPress: (optionName: string) => void;
  readonly?: boolean;
  /** If true, display buttons in a vertical column instead of horizontal row */
  vertical?: boolean;
}

export function OptionsButtons({
  options,
  onOptionPress,
  readonly = false,
  vertical = false,
}: OptionsButtonsProps) {
  const { theme } = useUnistyles();

  if (options.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, vertical && styles.containerVertical]}>
      {options.map((option) => {
        const _isJunk = option.type === "junk";
        const isMultiplier = option.type === "multiplier";
        const isSelected = option.selected;
        const isInherited = option.inherited ?? false;
        const isCalculated = option.calculated ?? false;

        // Color based on type and selection state
        // Calculated junk uses a distinct green color to indicate automatic
        const buttonColor = isSelected
          ? isCalculated
            ? "#27AE60" // Green for calculated/automatic junk
            : isMultiplier
              ? "#E74C3C" // Red for multipliers
              : "#3498DB" // Blue for user-toggleable junk
          : theme.colors.background;

        const textColor = isSelected ? "#FFFFFF" : theme.colors.primary;
        const borderColor = isSelected
          ? isCalculated
            ? "#27AE60"
            : isMultiplier
              ? "#E74C3C"
              : "#3498DB"
          : theme.colors.border;

        // Calculated junk and inherited options are disabled (can't toggle automatic junk)
        const isDisabled = readonly || isInherited || isCalculated;

        return (
          <TouchableOpacity
            key={option.name}
            style={[
              styles.optionButton,
              { backgroundColor: buttonColor, borderColor: borderColor },
              isDisabled && styles.optionButtonDisabled,
            ]}
            onPress={() => onOptionPress(option.name)}
            disabled={isDisabled}
            accessibilityLabel={`${option.displayName} ${isSelected ? "selected" : ""} ${isCalculated ? "automatic" : ""} ${isInherited ? "from previous hole" : ""}`}
          >
            {option.icon && (
              <FontAwesome6
                name={mapIconName(option.icon) as never}
                iconStyle="solid"
                size={16}
                color={textColor}
                style={styles.optionIcon}
              />
            )}
            <Text
              style={[
                styles.optionText,
                { color: textColor },
                isSelected && styles.optionTextSelected,
              ]}
            >
              {option.displayName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.gap(1),
    paddingVertical: theme.gap(1),
  },
  containerVertical: {
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-end",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 32,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: theme.gap(0.5),
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionTextSelected: {
    fontWeight: "600",
  },
}));
