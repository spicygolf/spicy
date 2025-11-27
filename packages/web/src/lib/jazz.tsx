/**
 * Jazz React App Context
 *
 * Provides Jazz authentication and data sync for the web app.
 * Uses better-auth for authentication with Jazz integration.
 */
import { AuthProvider } from "jazz-tools/better-auth/auth/react";
import { JazzReactProvider } from "jazz-tools/react";
import type { ReactNode } from "react";
import { PlayerAccount } from "spicylib/schema";
import { betterAuthClient } from "./auth-client";

export function JazzProvider({ children }: { children: ReactNode }) {
  const peer =
    (import.meta.env.VITE_JAZZ_PEER as `wss://${string}`) ||
    "wss://cloud.jazz.tools";

  return (
    <JazzReactProvider sync={{ peer }} AccountSchema={PlayerAccount}>
      {/* @ts-ignore - betterAuthClient types incompatible with AuthProvider */}
      <AuthProvider betterAuthClient={betterAuthClient}>
        {children}
      </AuthProvider>
    </JazzReactProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module "jazz-tools/react" {
  interface Register {
    Account: typeof PlayerAccount;
  }
}
