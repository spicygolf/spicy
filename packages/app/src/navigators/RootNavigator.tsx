import { useIsAuthenticated } from "jazz-tools/react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  const { theme } = useUnistyles();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
