// "use client";

import { createAuthClient } from "better-auth/client";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";

const getBaseURL = () => {
  if (__DEV__) {
    return "http://localhost:3040/v4/auth/";
  }
  return "https://api.spicy.golf/v4/auth/";
};

export const betterAuthClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [jazzPluginClient()],
});
