import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui/Text";

interface Props {
  label: string;
  display?: string;
}

export function Handicap({ label, display }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.display}>{display || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "column",
    alignItems: "center",
    padding: theme.gap(1),
  },
  label: {
    fontSize: 8,
  },
  display: {
    fontSize: 16,
  },
}));
