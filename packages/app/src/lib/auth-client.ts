// "use client";

import { createAuthClient } from "better-auth/client";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";
import { getApiUrl } from "@/hooks/useApi";

export const betterAuthClient = createAuthClient({
  baseURL: `${getApiUrl()}/auth/`,
  plugins: [jazzPluginClient()],
});
