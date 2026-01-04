import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";

const system = UnistylesRuntime.colorScheme === "dark" ? "dark" : "light";

const light = {
  colors: {
    primary: "#111",
    secondary: "#555",
    background: "#eee",
    action: "#007AFF",
    actionText: "#fff",
    error: "#ff3b30",
    border: "#e0e0e0",
    statusBar: "dark-content" as const,
    modalOverlay: "rgba(0, 0, 0, 0.5)",
    fave: {
      active: "#34C759",
      inactive: "#999999",
    },
    // Option button colors (junk, multipliers)
    junk: "#3498DB", // Blue for junk
    multiplier: "#E74C3C", // Red for multipliers
    // Score-to-par colors
    score: {
      albatross: "#FFD700", // Gold
      eagle: "#FF6B35", // Orange
      birdie: "#4ECDC4", // Teal
      par: "#95A5A6", // Gray
      bogey: "#E74C3C", // Red
      doubleBogey: "#C0392B", // Dark Red
      tripleBogey: "#8E44AD", // Purple
      worse: "#34495E", // Dark Gray
    },
    // Common contrast colors
    white: "#FFFFFF",
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
    error: "#ff453a",
    border: "#38383a",
    statusBar: "light-content" as const,
    modalOverlay: "rgba(255, 255, 255, 0.5)",
    fave: {
      active: "#34C759",
      inactive: "#666666",
    },
    // Option button colors (junk, multipliers)
    junk: "#3498DB", // Blue for junk
    multiplier: "#E74C3C", // Red for multipliers
    // Score-to-par colors (adjusted for dark background contrast)
    score: {
      albatross: "#FFD700", // Gold
      eagle: "#FF8C5A", // Lighter orange for dark bg
      birdie: "#5DE0D8", // Lighter teal for dark bg
      par: "#B0BEC5", // Lighter gray for dark bg
      bogey: "#FF6B6B", // Lighter red for dark bg
      doubleBogey: "#E57373", // Lighter dark red for dark bg
      tripleBogey: "#BA68C8", // Lighter purple for dark bg
      worse: "#78909C", // Lighter gray for dark bg (was #34495E)
    },
    // Common contrast colors
    white: "#FFFFFF",
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
