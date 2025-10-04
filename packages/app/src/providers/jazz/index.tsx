import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { JazzReactNativeProvider } from "jazz-tools/react-native";
import type React from "react";
import { PlayerAccount } from "spicylib/schema";
import { betterAuthClient } from "@/lib/auth-client";

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const peer =
    "wss://cloud.jazz.tools/?key=Y29femp3RHlqamV5Y3BYcGVSejdKTHM5eGh0N2NYfGNvX3pIUjV4WlRUbXdLVnNTYnoxeFU4VzdrYUhxZnxjb196NFJMZ2F3SlBZUkY3UFNuV25zTnFicXJWUFk";
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
