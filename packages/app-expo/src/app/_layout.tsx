import React, { StrictMode } from "react";
import { useDemoAuth, DemoAuthBasicUI } from "jazz-react-native";
import { Stack } from "expo-router/stack";
import { Jazz } from "@/providers/jazz/";
import { ThemeProvider } from "@/providers/theme";
import "@/global.css";

export default function Layout() {
  const [auth, state] = useDemoAuth();

  return (
    <StrictMode>
      <ThemeProvider>
        <Jazz.Provider
          auth={auth}
          peer="wss://cloud.jazz.tools/?key=jazzgolf@jazz.golf"
          storage={undefined}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </Jazz.Provider>
      </ThemeProvider>
      {state.state !== "signedIn" ? (
        <DemoAuthBasicUI appName="JazzGolf" state={state} />
      ) : null}
    </StrictMode>
  );
}
