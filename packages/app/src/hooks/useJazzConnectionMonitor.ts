import { useSyncConnectionStatus } from "jazz-tools/react-native";
import { usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { APP_VERSION } from "@/constants/version";

/**
 * Monitors Jazz sync connection status and captures events to PostHog.
 *
 * Events captured:
 * - `jazz_disconnected` — when Jazz WebSocket disconnects
 * - `jazz_reconnected` — when Jazz reconnects, with reconnection duration
 *
 * Must be called inside both PostHogProvider and JazzAndAuth.
 */
export function useJazzConnectionMonitor(): void {
  const connected = useSyncConnectionStatus();
  const posthog = usePostHog();
  const disconnectedAtRef = useRef<number | null>(null);
  const prevConnectedRef = useRef(connected);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevConnectedRef.current = connected;
      return;
    }

    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = connected;

    if (!posthog) return;

    // Went from connected to disconnected
    if (wasConnected && !connected) {
      disconnectedAtRef.current = Date.now();
      posthog.capture("jazz_disconnected", {
        platform: Platform.OS,
        app_version: APP_VERSION,
      });
    }

    // Went from disconnected to connected
    if (!wasConnected && connected) {
      const reconnectionDuration =
        disconnectedAtRef.current !== null
          ? (Date.now() - disconnectedAtRef.current) / 1000
          : null;
      disconnectedAtRef.current = null;
      posthog.capture("jazz_reconnected", {
        reconnection_duration_seconds: reconnectionDuration,
        platform: Platform.OS,
        app_version: APP_VERSION,
      });
    }
  }, [connected, posthog]);
}
