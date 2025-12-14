import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Text } from "@/ui";

interface GameOptionRowProps {
  option: GameOption;
  currentValue: string | undefined;
  onPress: () => void;
}

export function GameOptionRow({
  option,
  currentValue,
  onPress,
}: GameOptionRowProps) {
  const { theme } = useUnistyles();

  const displayValue = () => {
    const value = currentValue ?? option.defaultValue;

    switch (option.valueType) {
      case "bool":
        return value === "true" || value === "1" ? "Yes" : "No";
      case "menu":
        if (option.choices?.$isLoaded) {
          const choice = option.choices.find(
            (c) => c?.$isLoaded && c.name === value,
          );
          return choice?.$isLoaded ? choice.disp : value;
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
    paddingVertical: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
    flex: 1,
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  optionValueText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
}));
