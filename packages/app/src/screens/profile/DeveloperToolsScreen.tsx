import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Screen, Text } from "@/ui";

export function DeveloperToolsScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Tools for development and testing. These may change or be removed in
          production builds.
        </Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No developer tools available</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(2),
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(4),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontStyle: "italic",
  },
}));
