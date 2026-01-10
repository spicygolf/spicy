import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AppNavigator } from "./AppNavigator";

/**
 * Root navigator - always shows AppNavigator
 *
 * Auth gating is handled by PassphraseAuthUI in the JazzAndAuth provider.
 * When not authenticated, PassphraseAuthUI shows the login/register UI
 * instead of children (which includes this navigator).
 */
export function RootNavigator() {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle={theme.colors.statusBar}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
