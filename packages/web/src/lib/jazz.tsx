/**
 * Jazz React App Context
 *
 * Provides Jazz authentication and data sync for the web app.
 * Uses passphrase auth for development (passkey auth coming when Jazz PR merges).
 */
import { JazzReactProvider } from "jazz-tools/react";
import type { ReactNode } from "react";
import { PlayerAccount } from "spicylib/schema";
import { PassphraseAuthUI } from "@/components/PassphraseAuthUI";

export function JazzProvider({ children }: { children: ReactNode }) {
  const peer =
    (import.meta.env.VITE_JAZZ_PEER as `wss://${string}`) ||
    "wss://cloud.jazz.tools";

  return (
    <JazzReactProvider sync={{ peer }} AccountSchema={PlayerAccount}>
      <PassphraseAuthUI>{children}</PassphraseAuthUI>
    </JazzReactProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `PlayerAccount`
declare module "jazz-tools/react" {
  interface Register {
    Account: typeof PlayerAccount;
  }
}
