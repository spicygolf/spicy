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
}

interface OptionsButtonsProps {
  options: OptionButton[];
  onOptionPress: (optionName: string) => void;
  readonly?: boolean;
}

export function OptionsButtons({
  options,
  onOptionPress,
  readonly = false,
}: OptionsButtonsProps) {
  const { theme } = useUnistyles();

  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const _isJunk = option.type === "junk";
        const isMultiplier = option.type === "multiplier";
        const isSelected = option.selected;

        // Color based on type and selection state
        const buttonColor = isSelected
          ? isMultiplier
            ? "#E74C3C" // Red for multipliers
            : "#3498DB" // Blue for junk
          : theme.colors.background;

        const textColor = isSelected ? "#FFFFFF" : theme.colors.primary;
        const borderColor = isSelected
          ? isMultiplier
            ? "#E74C3C"
            : "#3498DB"
          : theme.colors.border;

        return (
          <TouchableOpacity
            key={option.name}
            style={[
              styles.optionButton,
              { backgroundColor: buttonColor, borderColor: borderColor },
              readonly && styles.optionButtonDisabled,
            ]}
            onPress={() => onOptionPress(option.name)}
            disabled={readonly}
            accessibilityLabel={`${option.displayName} ${isSelected ? "selected" : ""}`}
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
