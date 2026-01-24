import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";

interface OptionSectionHeaderProps {
  title: string;
}

export function OptionSectionHeader({ title }: OptionSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
}));
