// "use client";

import { createAuthClient } from "better-auth/client";
import { jazzPluginClient } from "jazz-tools/better-auth/auth/client";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (__DEV__) {
    // Android emulators must use 10.0.2.2 to access the host's localhost
    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    return `http://${host}:3040/v4/auth/`;
  }
  return "https://api.spicy.golf/v4/auth/";
};

export const betterAuthClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [jazzPluginClient()],
});
