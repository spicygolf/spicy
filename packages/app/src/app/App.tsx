import { StrictMode } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "@/navigators/RootNavigator";
import { JazzAndAuth } from "@/providers/jazz";
import { NavigationProvider } from "@/providers/navigation";
import { ReactQueryProvider } from "@/providers/react-query";

export function App() {
  return (
    <StrictMode>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <JazzAndAuth>
            <NavigationProvider>
              <RootNavigator />
            </NavigationProvider>
          </JazzAndAuth>
        </ReactQueryProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}

LogBox.ignoreLogs([
  "Open debugger to view warnings",
  "findNodeHandle is deprecated in StrictMode",
]);
