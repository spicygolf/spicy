import { useIsAuthenticated } from "jazz-tools/react-native";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle={theme.colors.statusBar}
        backgroundColor="transparent"
        translucent
      />
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
