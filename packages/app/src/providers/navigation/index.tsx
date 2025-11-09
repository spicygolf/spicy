import { NavigationContainer } from "@react-navigation/native";
import type React from "react";
import { ActivityIndicator } from "react-native";
import { linking } from "./linking";

export const NavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    // @ts-expect-error - Deep navigation config types are complex and difficult to infer
    <NavigationContainer linking={linking} fallback={<ActivityIndicator />}>
      {children}
    </NavigationContainer>
  );
};
