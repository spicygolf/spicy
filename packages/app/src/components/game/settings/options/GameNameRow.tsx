import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface GameNameRowProps {
  name: string;
  onPress?: () => void;
}

export function GameNameRow({ name, onPress }: GameNameRowProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable style={styles.optionRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.optionLabel}>Name</Text>
      <View style={styles.optionValue}>
        <Text style={styles.optionValueText}>{name}</Text>
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
