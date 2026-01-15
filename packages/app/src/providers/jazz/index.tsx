import { JazzReactNativeProvider } from "jazz-tools/react-native";
import { RNCrypto } from "jazz-tools/react-native-core/crypto/RNCrypto";
import type React from "react";
import { useEffect } from "react";
import { setJazzWorkerAccount } from "spicylib/config/env";
import { PlayerAccount } from "spicylib/schema";
import { useJazzCredentials } from "@/hooks/useJazzCredentials";
import { PassphraseAuthUI } from "./PassphraseAuthUI";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const { data: credentials } = useJazzCredentials();

  // Set worker account when credentials are loaded
  useEffect(() => {
    if (credentials?.workerAccount) {
      setJazzWorkerAccount(credentials.workerAccount);
    }
  }, [credentials?.workerAccount]);

  const peer =
    `wss://cloud.jazz.tools/?key=${credentials.cloudKey}` as `wss://${string}`;

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
