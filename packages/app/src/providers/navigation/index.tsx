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
    <NavigationContainer linking={linking} fallback={<ActivityIndicator />}>
      {children}
    </NavigationContainer>
  );
};
