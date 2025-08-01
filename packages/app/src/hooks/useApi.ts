export function useApi() {
  if (__DEV__) {
    return "http://localhost:3040/v4";
  }

  return "https://api.spicy.golf/v4";
}
