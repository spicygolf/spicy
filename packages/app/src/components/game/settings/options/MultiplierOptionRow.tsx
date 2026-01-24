import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { MultiplierOption } from "spicylib/schema";
import { Text } from "@/ui";

interface MultiplierOptionRowProps {
  option: MultiplierOption;
  onPress: () => void;
}

export function MultiplierOptionRow({
  option,
  onPress,
}: MultiplierOptionRowProps) {
  const { theme } = useUnistyles();

  const valueDisplay = option.value ? `${option.value}x` : "variable";
  const scopeLabel =
    option.scope && option.scope !== "none" ? ` (${option.scope})` : "";

  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <View style={styles.optionLeft}>
        <Text style={styles.optionLabel}>{option.disp}</Text>
      </View>
      <View style={styles.optionValue}>
        <Text style={styles.optionValueText}>
          {valueDisplay}
          {scopeLabel}
        </Text>
        <FontAwesome6
          name="chevron-right"
          iconStyle="solid"
          size={10}
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
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.75),
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionValueText: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
}));
