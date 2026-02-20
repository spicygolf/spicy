import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatDate, formatTime } from "spicylib/utils";
import { Text } from "@/ui";

interface TeeTimeRowProps {
  start: Date;
  onPress?: () => void;
}

export function TeeTimeRow({ start, onPress }: TeeTimeRowProps) {
  const { theme } = useUnistyles();

  const displayValue = `${formatDate(start)} - ${formatTime(start)}`;

  return (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <Text style={styles.optionLabel}>Tee Time</Text>
      <View style={styles.optionValue}>
        <Text style={styles.optionValueText}>{displayValue}</Text>
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
