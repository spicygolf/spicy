import { Platform } from "react-native";

export function useApi() {
  if (__DEV__) {
    // Android emulators must use 10.0.2.2 to access the host's localhost
    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    return `http://${host}:3040/v4`;
  }

  return "https://api.spicy.golf/v4";
}
