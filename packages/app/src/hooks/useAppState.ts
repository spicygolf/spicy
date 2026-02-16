import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

interface AppStateInfo {
  /** Current app state */
  appState: AppStateStatus;
  /** Increments each time the app returns to 'active' from background/inactive */
  foregroundCounter: number;
  /** Timestamp (ms) when the app last went to background, or null if currently active */
  backgroundSince: number | null;
  /** Duration in seconds of the last background period, or null if never backgrounded */
  lastBackgroundDuration: number | null;
}

/**
 * Lightweight hook wrapping React Native's AppState API.
 *
 * Tracks app state transitions (active/background/inactive) and exposes:
 * - foregroundCounter: increments on each return to active
 * - backgroundSince: timestamp of when app entered background
 * - lastBackgroundDuration: how long the last background period lasted
 *
 * Emits no side effects — consumers decide what to do with the state.
 */
export function useAppState(): AppStateInfo {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [foregroundCounter, setForegroundCounter] = useState(0);
  const [lastBackgroundDuration, setLastBackgroundDuration] = useState<
    number | null
  >(null);
  const backgroundSinceRef = useRef<number | null>(null);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      const prevState = appState;

      if (nextAppState === "background" || nextAppState === "inactive") {
        if (backgroundSinceRef.current === null) {
          backgroundSinceRef.current = Date.now();
        }
      }

      if (
        nextAppState === "active" &&
        (prevState === "background" || prevState === "inactive")
      ) {
        if (backgroundSinceRef.current !== null) {
          const duration = (Date.now() - backgroundSinceRef.current) / 1000;
          setLastBackgroundDuration(duration);
          backgroundSinceRef.current = null;
        }
        setForegroundCounter((prev) => prev + 1);
      }

      setAppState(nextAppState);
    },
    [appState],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [handleAppStateChange]);

  return {
    appState,
    foregroundCounter,
    backgroundSince: backgroundSinceRef.current,
    lastBackgroundDuration,
  };
}
