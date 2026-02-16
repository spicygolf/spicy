import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { useEffect } from "react";
import { setJazzWorkerAccount } from "spicylib/config/env";
import { PlayerAccount } from "spicylib/schema";
import { useJazzCredentials } from "@/hooks/useJazzCredentials";
import { AuthUI } from "./AuthUI";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const { data: credentials } = useJazzCredentials();

  // Set worker account when credentials are loaded
  useEffect(() => {
    if (credentials?.workerAccount) {
      setJazzWorkerAccount(credentials.workerAccount);
    }
  }, [credentials?.workerAccount]);

  const peer =
    `wss://cloud.jazz.tools/?key=${credentials.apiKey}` as `wss://${string}`;

  return (
    <JazzReactNativeProvider sync={{ peer }} AccountSchema={PlayerAccount}>
      <AuthUI>{children}</AuthUI>
    </JazzReactNativeProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module "jazz-tools/react-native" {
  interface Register {
    Account: typeof PlayerAccount;
  }
}
