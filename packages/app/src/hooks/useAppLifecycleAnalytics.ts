import { usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { APP_VERSION } from "@/constants/version";
import { useAppState } from "./useAppState";

/**
 * Captures app lifecycle events to PostHog for diagnostics.
 *
 * Events captured:
 * - `app_backgrounded` — when app goes to background
 * - `app_foregrounded` — when app returns to active, with background duration
 *
 * Must be called inside both PostHogProvider and JazzAndAuth.
 */
export function useAppLifecycleAnalytics(): void {
  const { appState, foregroundCounter, lastBackgroundDuration } = useAppState();
  const posthog = usePostHog();
  const prevAppStateRef = useRef(appState);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial mount — we only care about transitions
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevAppStateRef.current = appState;
      return;
    }

    const prevState = prevAppStateRef.current;
    prevAppStateRef.current = appState;

    if (!posthog) return;

    if (appState === "background" && prevState === "active") {
      posthog.capture("app_backgrounded", {
        platform: Platform.OS,
        app_version: APP_VERSION,
      });
    }

    if (appState === "active" && prevState !== "active") {
      posthog.capture("app_foregrounded", {
        background_duration_seconds: lastBackgroundDuration,
        foreground_count: foregroundCounter,
        platform: Platform.OS,
        app_version: APP_VERSION,
      });
    }
  }, [appState, foregroundCounter, lastBackgroundDuration, posthog]);
}
