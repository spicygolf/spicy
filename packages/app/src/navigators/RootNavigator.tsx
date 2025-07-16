import { useIsAuthenticated } from "jazz-tools/react-native";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
