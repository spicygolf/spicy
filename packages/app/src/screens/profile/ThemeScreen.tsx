import { View } from "react-native";
import type { UnistylesThemes } from "react-native-unistyles";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { ButtonGroup, Screen, Text } from "@/ui";

export function ThemeScreen() {
  const themes = ["light", "dark", "system"];
  const buttons = [
    {
      label: "light",
      iconName: "sun" as const,
      onPress: () => {
        setTheme(0);
      },
    },
    {
      label: "dark",
      iconName: "moon" as const,
      onPress: () => {
        setTheme(1);
      },
    },
    {
      label: "system",
      iconName: "computer" as const,
      onPress: () => {
        setTheme(2);
      },
    },
  ];

  const setTheme = (scheme: number) => {
    const system =
      UnistylesRuntime.colorScheme === "dark"
        ? themes.indexOf("dark")
        : themes.indexOf("light");
    if (scheme === themes.indexOf("system")) {
      scheme = system;
    }
    const themeName = themes[scheme] as keyof UnistylesThemes;
    UnistylesRuntime.setTheme(themeName);
    const theme = UnistylesRuntime.getTheme(themeName);
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.background);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Choose how the app appears. System will match your device settings.
        </Text>
        <ButtonGroup buttons={buttons} selectedIndex={2} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(2),
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
