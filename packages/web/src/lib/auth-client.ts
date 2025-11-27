import { createAuthClient } from "better-auth/client";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";

export const betterAuthClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/`,
  plugins: [jazzPluginClient()],
});
