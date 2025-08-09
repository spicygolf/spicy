import { AuthProvider } from "jazz-react-auth-betterauth";
import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { PlayerAccount } from "spicylib/schema";
import { useApi } from "@/hooks";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const peer = "wss://cloud.jazz.tools/?key=spicy-dev@druid.golf";

  return (
    <JazzReactNativeProvider sync={{ peer }} AccountSchema={PlayerAccount}>
      <AuthProvider
        options={{
          baseURL: `${api}/auth`,
        }}
      >
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
