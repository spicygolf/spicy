import { Platform } from "react-native";

function getDevHost(): string {
  // Use DEV_API_HOST environment variable if set (e.g., your laptop's IP)
  // Set this in your .env file or when running the dev server
  const envHost = process.env.DEV_API_HOST;
  if (envHost) {
    return envHost;
  }

  // Default behavior based on platform
  if (Platform.OS === "ios") {
    // iOS Simulator can use localhost
    return "localhost";
  }

  if (Platform.OS === "android") {
    // Android Emulator uses 10.0.2.2 to reach host machine
    // For real Android devices, set DEV_API_HOST to your laptop's IP
    return "10.0.2.2";
  }

  return "localhost";
}

export function getApiUrl(): string {
  if (__DEV__) {
    const host = getDevHost();
    return `http://${host}:3040/v4`;
  }

  // TODO: Revert to https://api.spicy.golf/v4 after local testing
  // Temporary: Use local API for testing on device hotspot
  return "http://10.187.12.52:3040/v4";
}

export function useApi(): string {
  return getApiUrl();
}
