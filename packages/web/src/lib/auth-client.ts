/**
 * Auth client stub
 *
 * TODO: Implement Jazz passkey auth for web once the Jazz passkey PR is merged.
 * For now, the web admin interface auth is stubbed out.
 */

type SessionData = {
  data: {
    user?: { email: string };
    session?: { isAdmin: boolean };
  } | null;
};

type AuthResult = {
  data?: unknown;
  error?: { message: string };
};

type AuthError = {
  error: { message: string };
};

// Stub auth client that matches the expected interface
export const betterAuthClient = {
  getSession: async (): Promise<SessionData> => {
    console.warn("Auth disabled - pending Jazz passkey migration");
    return { data: null };
  },
  signIn: {
    email: async (
      _credentials: { email: string; password: string },
      _options?: { onSuccess?: () => void; onError?: (e: AuthError) => void },
    ): Promise<AuthResult> => {
      console.warn("Auth disabled - pending Jazz passkey migration");
      _options?.onError?.({
        error: { message: "Auth disabled - pending Jazz passkey migration" },
      });
      return { error: { message: "Auth disabled" } };
    },
  },
  signUp: {
    email: async (
      _data: { email: string; password: string; name: string },
      _options?: { onSuccess?: () => void; onError?: (e: AuthError) => void },
    ): Promise<AuthResult> => {
      console.warn("Auth disabled - pending Jazz passkey migration");
      _options?.onError?.({
        error: { message: "Auth disabled - pending Jazz passkey migration" },
      });
      return { error: { message: "Auth disabled" } };
    },
  },
  signOut: async () => {
    console.warn("Auth disabled - pending Jazz passkey migration");
  },
};
