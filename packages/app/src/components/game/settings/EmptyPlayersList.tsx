import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";

export function EmptyPlayersList() {
  return <Text style={styles.text}>No players in this game</Text>;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.secondary,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: theme.gap(3),
  },
}));
