import {
  NavigationContainer,
  type NavigationState,
} from "@react-navigation/native";
import { usePostHog } from "posthog-react-native";
import type React from "react";
import { useCallback, useRef } from "react";
import { ActivityIndicator } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { linking } from "./linking";

/** Extract the active route name from a potentially nested navigation state. */
function getActiveRouteName(state: NavigationState): string | undefined {
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

export const NavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useUnistyles();
  const posthog = usePostHog();
  const currentRouteRef = useRef<string | undefined>(undefined);

  const navigationTheme = {
    dark: false,
    colors: {
      primary: theme.colors.action,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.primary,
      border: theme.colors.border,
      notification: theme.colors.action,
    },
    fonts: {
      regular: {
        fontFamily: "System",
        fontWeight: "400" as const,
      },
      medium: {
        fontFamily: "System",
        fontWeight: "500" as const,
      },
      bold: {
        fontFamily: "System",
        fontWeight: "700" as const,
      },
      heavy: {
        fontFamily: "System",
        fontWeight: "800" as const,
      },
    },
  };

  const handleStateChange = useCallback(
    (state: NavigationState | undefined): void => {
      if (!state || !posthog) return;
      const routeName = getActiveRouteName(state);
      if (routeName && routeName !== currentRouteRef.current) {
        currentRouteRef.current = routeName;
        posthog.screen(routeName);
      }
    },
    [posthog],
  );

  return (
    <NavigationContainer
      // @ts-expect-error - Deep navigation config types are complex and difficult to infer
      linking={linking}
      fallback={<ActivityIndicator />}
      theme={navigationTheme}
      onStateChange={handleStateChange}
    >
      {children}
    </NavigationContainer>
  );
};
