import { POSTHOG_API_KEY, POSTHOG_HOST } from "@env";
import { useAccount } from "jazz-tools/react-native";
import {
  PostHogProvider as PHProvider,
  usePostHog,
} from "posthog-react-native";
import { type ReactNode, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { PlayerAccount } from "spicylib/schema";
import { APP_VERSION } from "@/constants/version";

interface PostHogProviderProps {
  children: ReactNode;
}

/**
 * PostHog analytics and error tracking provider.
 *
 * Features enabled:
 * - Session replay with masked text inputs (images unmasked for RN button visibility)
 * - Error tracking (uncaught exceptions, unhandled rejections)
 * - Screen capture and touch tracking
 * - Network telemetry (iOS only)
 *
 * If POSTHOG_API_KEY is not set, PostHog is disabled and children are rendered directly.
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  // Skip PostHog in development mode or if API key is not configured
  if (__DEV__ || !POSTHOG_API_KEY) {
    if (!__DEV__ && !POSTHOG_API_KEY) {
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
          // Don't mask images - buttons render as images in RN and get masked
          maskAllImages: false,
          // Capture Android Logcat logs
          captureLog: true,
          // Capture network telemetry (iOS only, no body data)
          captureNetworkTelemetry: true,
          // Throttle snapshots for battery life (default 1000ms)
          throttleDelayMs: 2000,
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
        // Screen tracking handled via NavigationContainer onStateChange
        captureScreens: false,
      }}
    >
      {children}
    </PHProvider>
  );
}

/**
 * Identifies the current Jazz user in PostHog.
 *
 * Must be rendered inside both PostHogProvider and JazzAndAuth.
 * Calls posthog.identify() once when the user account loads.
 */
export function PostHogIdentifier(): null {
  const me = useAccount(PlayerAccount, {
    resolve: { root: { player: true } },
  });
  const posthog = usePostHog();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog || !me?.$isLoaded) return;

    const accountId = me.$jazz.id;
    if (identifiedRef.current === accountId) return;

    identifiedRef.current = accountId;

    const playerName =
      me.root?.$isLoaded && me.root.player?.$isLoaded
        ? me.root.player.name
        : undefined;

    posthog.identify(accountId, {
      ...(playerName && { name: playerName }),
      platform: Platform.OS,
      app_version: APP_VERSION,
    });
  }, [me, posthog]);

  return null;
}
