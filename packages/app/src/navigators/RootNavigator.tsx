import { useIsAuthenticated } from "jazz-tools/react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
