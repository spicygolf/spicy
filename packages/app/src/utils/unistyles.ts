import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";

const system = UnistylesRuntime.colorScheme === "dark" ? "dark" : "light";

const light = {
  colors: {
    primary: "#111",
    secondary: "#555",
    background: "#eee",
    action: "#007AFF",
    actionText: "#fff",
  },
  // functions, external imports, etc.
  gap: (v: number) => v * 8,
};

const dark = {
  colors: {
    primary: "#eee",
    secondary: "#999",
    background: "#111",
    action: "#007AFF",
    actionText: "#fff",
  },
  gap: (v: number) => v * 8,
};

export const appThemes = {
  light,
  dark,
};

type AppThemes = typeof appThemes;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  settings: {
    initialTheme: system,
  },
  themes: appThemes,
});
