import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Text } from "@/ui";

interface GameOptionRowProps {
  option: GameOption;
  currentValue: string | undefined;
  onPress: () => void;
  /** Navigate to per-hole customization screen */
  onCustomizePress?: () => void;
  /** Whether this option has per-hole overrides active */
  hasOverrides?: boolean;
}

export function GameOptionRow({
  option,
  currentValue,
  onPress,
  onCustomizePress,
  hasOverrides,
}: GameOptionRowProps) {
  const { theme } = useUnistyles();

  const displayValue = () => {
    const value = currentValue ?? option.defaultValue;

    switch (option.valueType) {
      case "bool":
        return value === "true" || value === "1" ? "Yes" : "No";
      case "menu":
        // Choices are plain JSON arrays now
        if (option.choices) {
          const choice = option.choices.find((c) => c.name === value);
          return choice ? choice.disp : value;
        }
        return value;
      case "num":
        return value;
      case "text":
        return value;
      default:
        return value;
    }
  };

  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <Text style={styles.optionLabel}>{option.disp}</Text>
      <View style={styles.optionValue}>
        {onCustomizePress && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onCustomizePress();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Customize ${option.disp} per hole`}
          >
            <FontAwesome6
              name="sliders"
              iconStyle="solid"
              size={14}
              color={
                hasOverrides ? theme.colors.action : theme.colors.secondary
              }
            />
          </Pressable>
        )}
        <Text style={styles.optionValueText}>{displayValue()}</Text>
        <FontAwesome6
          name="chevron-right"
          iconStyle="solid"
          size={14}
          color={theme.colors.secondary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
    flex: 1,
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.75),
  },
  optionValueText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
