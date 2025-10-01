import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { PlayerAccount } from "spicylib/schema";
import { betterAuthClient } from "@/lib/auth-client";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer = "wss://cloud.jazz.tools/?key=spicy-dev@druid.golf";
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
