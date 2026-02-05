import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui/Text";

interface Props {
  label: string;
  display?: string;
  color?: string;
}

export function Handicap({ label, display, color }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, color && { color }]}>{label}</Text>
      <Text style={[styles.display, color && { color }]}>{display || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(0.5),
  },
  label: {
    fontSize: 8,
  },
  display: {
    fontSize: 14,
  },
}));
