import { jazzErrorReporter } from "jazz-tools";
import { StrictMode, useEffect } from "react";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "@/navigators/RootNavigator";
import { JazzAndAuth } from "@/providers/jazz";
import { NavigationProvider } from "@/providers/navigation";
import { ReactQueryProvider } from "@/providers/react-query";

export function App() {
  useEffect(function subscribeToJazzErrors() {
    // Subscribe to Jazz errors - the callback fires immediately when errors occur
    // The stack trace now shows where the subscription was CREATED (the component that called useCoState)
    const unsubscribe = jazzErrorReporter.onError((error) => {
      console.error("🔴 JAZZ ERROR:", error.type);
      console.error("  CoValue ID:", error.coValueId);
      console.error("  Message:", error.message);
      console.error("  📍 Subscription created at (look for your app code):");
      console.error("  ", error.stack);
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StrictMode>
        <SafeAreaProvider>
          <ReactQueryProvider>
            <JazzAndAuth>
              <NavigationProvider>
                <RootNavigator />
              </NavigationProvider>
            </JazzAndAuth>
          </ReactQueryProvider>
        </SafeAreaProvider>
      </StrictMode>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

LogBox.ignoreLogs([
  "Open debugger to view warnings",
  "findNodeHandle is deprecated in StrictMode",
  "findHostInstance_DEPRECATED",
  "findHostInstance_DEPRECATED is deprecated in StrictMode",
]);
