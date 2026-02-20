import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { JunkOption } from "spicylib/schema";
import { Text } from "@/ui";

interface JunkOptionRowProps {
  option: JunkOption;
  onPress?: () => void;
}

export function JunkOptionRow({ option, onPress }: JunkOptionRowProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable style={styles.optionRow} onPress={onPress} disabled={!onPress}>
      <View style={styles.optionLeft}>
        <Text style={styles.optionLabel}>{option.disp}</Text>
      </View>
      <View style={styles.optionValue}>
        <Text style={styles.optionValueText}>
          {option.value} {option.value === 1 ? "pt" : "pts"}
        </Text>
        {onPress && (
          <FontAwesome6
            name="chevron-right"
            iconStyle="solid"
            size={14}
            color={theme.colors.secondary}
          />
        )}
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
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.primary,
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
