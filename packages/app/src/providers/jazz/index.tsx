import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { ActivityIndicator, View } from "react-native";
import { PlayerAccount } from "spicylib/schema";
import { useJazzCredentials } from "@/hooks/useJazzCredentials";
import { betterAuthClient } from "@/lib/auth-client";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const { data: credentials, isLoading } = useJazzCredentials();

  if (!credentials || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const peer =
    `wss://cloud.jazz.tools/?key=${credentials.apiKey}` as `wss://${string}`;

  return (
    <JazzReactNativeProvider sync={{ peer }} AccountSchema={PlayerAccount}>
      <AuthProvider betterAuthClient={betterAuthClient}>
        {children}
      </AuthProvider>
    </JazzReactNativeProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module "jazz-tools/react-native" {
  interface Register {
    Account: typeof PlayerAccount;
  }
}
