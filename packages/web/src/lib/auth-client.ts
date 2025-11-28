import { createAuthClient } from "better-auth/client";
import { customSessionClient } from "better-auth/client/plugins";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";
import type { auth } from "../../../api/src/lib/auth";

export const betterAuthClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/`,
  plugins: [jazzPluginClient(), customSessionClient<typeof auth>()],
});
