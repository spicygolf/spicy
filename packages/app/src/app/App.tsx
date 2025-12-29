import { jazzConfig } from "jazz-tools";
import { StrictMode } from "react";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RootNavigator } from "@/navigators/RootNavigator";
import { JazzAndAuth } from "@/providers/jazz";
import { NavigationProvider } from "@/providers/navigation";
import { PostHogProvider } from "@/providers/posthog";
import { ReactQueryProvider } from "@/providers/react-query";

if (__DEV__) {
  jazzConfig.setCustomErrorReporter(
    (error, { getPrettyStackTrace, jazzError }) => {
      console.error("🔴 JAZZ ERROR:", jazzError.type);
      console.error("  CoValue ID:", jazzError.id);
      console.error("  Message:", error.message);
      console.error("  📍 Subscription created at:");
      console.error(getPrettyStackTrace());
    },
  );
}

export function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StrictMode>
        <ErrorBoundary>
          <PostHogProvider>
            <SafeAreaProvider>
              <NavigationProvider>
                <ReactQueryProvider>
                  <JazzAndAuth>
                    <RootNavigator />
                  </JazzAndAuth>
                </ReactQueryProvider>
              </NavigationProvider>
            </SafeAreaProvider>
          </PostHogProvider>
        </ErrorBoundary>
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
