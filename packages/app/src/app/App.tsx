import { jazzConfig } from "jazz-tools";
import { StrictMode, useEffect } from "react";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppLifecycleAnalytics } from "@/hooks/useAppLifecycleAnalytics";
import { prefetchErrorMessages } from "@/hooks/useErrorMessages";
import { useJazzConnectionMonitor } from "@/hooks/useJazzConnectionMonitor";
import { RootNavigator } from "@/navigators/RootNavigator";
import { JazzAndAuth } from "@/providers/jazz";
import { NavigationProvider } from "@/providers/navigation";
import { PostHogIdentifier, PostHogProvider } from "@/providers/posthog";
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

/** Activates app lifecycle and Jazz connection monitoring inside the provider tree. */
function AppInstrumentation(): null {
  useAppLifecycleAnalytics();
  useJazzConnectionMonitor();
  return null;
}

export function App() {
  // Prefetch error messages on startup (fire-and-forget)
  useEffect(() => {
    prefetchErrorMessages();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StrictMode>
        <ErrorBoundary>
          <PostHogProvider>
            <SafeAreaProvider>
              <NavigationProvider>
                <ReactQueryProvider>
                  <JazzAndAuth>
                    <AppInstrumentation />
                    <PostHogIdentifier />
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
