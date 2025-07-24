import { View } from "react-native";
import type { UnistylesThemes } from "react-native-unistyles";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { ButtonGroup, Text } from "@/ui";

export function Theme() {
  const themes = ["light", "dark", "system"];
  const buttons = [
    {
      label: "light",
      iconName: "sun",
      onPress: () => {
        setTheme(0);
      },
    },
    {
      label: "dark",
      iconName: "moon",
      onPress: () => {
        setTheme(1);
      },
    },
    {
      label: "system",
      iconName: "computer",
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
    <View style={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <ButtonGroup buttons={buttons} selectedIndex={2} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.gap(2),
  },
  title: {
    fontWeight: "bold",
    paddingBottom: theme.gap(1),
  },
  themeTabs: {
    backgroundColor: "#666",
  },
  themeActiveFont: {
    color: "#24a0ed",
  },
  themeInactiveFont: {
    color: "gray",
  },
}));
