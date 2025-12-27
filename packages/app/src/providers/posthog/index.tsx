import { PostHogProvider as PHProvider } from "posthog-react-native";
import type { ReactNode } from "react";

// PostHog configuration (public client-side keys)
// TODO: Move to .env if needed for different environments
const POSTHOG_API_KEY = "phc_Vmzq2esdAdfBEnin2kFueQD2xR3YyHRoHSTfKZvOF0G";
const POSTHOG_HOST = "https://us.i.posthog.com";

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
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
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
        captureScreens: true,
      }}
    >
      {children}
    </PHProvider>
  );
}
