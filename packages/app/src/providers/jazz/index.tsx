import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { ActivityIndicator, View } from "react-native";
import { PlayerAccount } from "spicylib/schema";
import { useApi } from "@/hooks";
import { useJazzCredentials } from "@/hooks/useJazzCredentials";
import { betterAuthClient } from "@/lib/auth-client";
import { Text } from "@/ui";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const { data: credentials, isLoading, error } = useJazzCredentials();
  const _api = useApi();

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ marginBottom: 10, fontSize: 18 }}>Connection Error</Text>
        <Text style={{ textAlign: "center" }}>
          {error instanceof Error ? error.message : "Failed to connect to API"}
        </Text>
      </View>
    );
  }

  if (!credentials || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Connecting to API...</Text>
        <Text style={{ marginTop: 20, fontSize: 12, textAlign: "center" }}>
          Debug:{"\n"}
          isLoading: {String(isLoading)}
          {"\n"}
          hasCredentials: {String(!!credentials)}
          {"\n"}
          hasError: {String(!!error)}
        </Text>
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
