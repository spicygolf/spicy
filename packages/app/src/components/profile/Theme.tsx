import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { View } from "react-native";
import type { UnistylesThemes } from "react-native-unistyles";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { Text } from "@/ui";

export function Theme() {
  const themes = ["light", "dark", "system"];
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
      <SegmentedControl
        values={themes}
        selectedIndex={2}
        onChange={(event) => setTheme(event.nativeEvent.selectedSegmentIndex)}
        sliderStyle={styles.themeTabs}
        fontStyle={styles.themeInactiveFont}
        activeFontStyle={styles.themeActiveFont}
      />
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
