import { NavigationContainer } from "@react-navigation/native";
import type React from "react";
import { ActivityIndicator } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { linking } from "./linking";

export const NavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useUnistyles();

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

  return (
    <NavigationContainer
      // @ts-expect-error - Deep navigation config types are complex and difficult to infer
      linking={linking}
      fallback={<ActivityIndicator />}
      theme={navigationTheme}
    >
      {children}
    </NavigationContainer>
  );
};
