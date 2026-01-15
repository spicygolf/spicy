import { POSTHOG_API_KEY, POSTHOG_HOST } from "@env";
import { PostHogProvider as PHProvider } from "posthog-react-native";
import type { ReactNode } from "react";

interface PostHogProviderProps {
  children: ReactNode;
}

/**
 * PostHog analytics and error tracking provider.
 *
 * Features enabled:
 * - Session replay with masked text/images for privacy
 * - Error tracking (uncaught exceptions, unhandled rejections)
 * - Screen capture and touch tracking
 * - Network telemetry (iOS only)
 *
 * If POSTHOG_API_KEY is not set, PostHog is disabled and children are rendered directly.
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  // Skip PostHog if API key is not configured (e.g., in CI/E2E tests)
  if (!POSTHOG_API_KEY) {
    if (!__DEV__) {
      console.warn(
        "PostHog analytics disabled: POSTHOG_API_KEY not set. " +
          "This is expected in E2E tests but not in production builds.",
      );
    }
    return <>{children}</>;
  }

  return (
    <PHProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        // Session replay configuration
        enableSessionReplay: true,
        sessionReplayConfig: {
          // Mask text inputs for privacy (passwords always masked)
          maskAllTextInputs: true,
          // Mask images for privacy
          maskAllImages: true,
          // Capture Android Logcat logs
          captureLog: true,
          // Capture network telemetry (iOS only, no body data)
          captureNetworkTelemetry: true,
          // Throttle snapshots for performance (1000ms default)
          throttleDelayMs: 1000,
        },
        // Error tracking configuration
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: ["error"],
          },
        },
      }}
      autocapture={{
        captureTouches: true,
        // Disabled: requires being inside NavigationContainer
        // Screen tracking happens via session replay instead
        captureScreens: false,
      }}
    >
      {children}
    </PHProvider>
  );
}
