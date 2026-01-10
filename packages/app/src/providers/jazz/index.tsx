import { JazzReactNativeProvider } from "jazz-tools/react-native";
import { RNCrypto } from "jazz-tools/react-native-core/crypto/RNCrypto";
import type React from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { setJazzWorkerAccount } from "spicylib/config/env";
import { PlayerAccount } from "spicylib/schema";
import { useJazzCredentials } from "@/hooks/useJazzCredentials";
import { Text } from "@/ui";
import { PassphraseAuthUI } from "./PassphraseAuthUI";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const { data: credentials, isLoading, error } = useJazzCredentials();

  // Set worker account when credentials are loaded
  useEffect(() => {
    if (credentials?.workerAccount) {
      setJazzWorkerAccount(credentials.workerAccount);
    }
  }, [credentials?.workerAccount]);

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
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  const peer =
    `wss://cloud.jazz.tools/?key=${credentials.apiKey}` as `wss://${string}`;

  return (
    <JazzReactNativeProvider
      sync={{ peer }}
      CryptoProvider={RNCrypto}
      AccountSchema={PlayerAccount}
    >
      <PassphraseAuthUI>{children}</PassphraseAuthUI>
    </JazzReactNativeProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module "jazz-tools/react-native" {
  interface Register {
    Account: typeof PlayerAccount;
  }
}
