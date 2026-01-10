import { useAccount } from "jazz-tools/react-native";
import { View } from "react-native";
import type { UnistylesThemes } from "react-native-unistyles";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { PlayerAccount, Settings } from "spicylib/schema";
import { ButtonGroup, Screen, Text } from "@/ui";

type ThemeSetting = "light" | "dark" | "system";

export function ThemeScreen() {
  const me = useAccount(PlayerAccount, {
    resolve: { root: { settings: true } },
  });

  const themes: ThemeSetting[] = ["light", "dark", "system"];

  // Get current setting from Jazz, default to "system"
  const currentSetting: ThemeSetting =
    me?.$isLoaded && me.root?.$isLoaded && me.root.settings?.$isLoaded
      ? (me.root.settings.theme ?? "system")
      : "system";

  const selectedIndex = themes.indexOf(currentSetting);

  const setTheme = (setting: ThemeSetting) => {
    // Save to Jazz
    if (me?.$isLoaded && me.root?.$isLoaded) {
      if (!me.root.$jazz.has("settings")) {
        me.root.$jazz.set(
          "settings",
          Settings.create({ theme: setting }, { owner: me.root.$jazz.owner }),
        );
      } else if (me.root.settings?.$isLoaded) {
        me.root.settings.$jazz.set("theme", setting);
      }
    }

    // Apply theme to Unistyles
    applyTheme(setting);
  };

  const applyTheme = (setting: ThemeSetting) => {
    let themeName: keyof UnistylesThemes;

    if (setting === "system") {
      // Use device color scheme
      themeName = UnistylesRuntime.colorScheme === "dark" ? "dark" : "light";
    } else {
      themeName = setting;
    }

    UnistylesRuntime.setTheme(themeName);
    const theme = UnistylesRuntime.getTheme(themeName);
    UnistylesRuntime.setRootViewBackgroundColor(theme.colors.background);
  };

  const buttons = [
    {
      label: "light",
      iconName: "sun" as const,
      onPress: () => setTheme("light"),
    },
    {
      label: "dark",
      iconName: "moon" as const,
      onPress: () => setTheme("dark"),
    },
    {
      label: "system",
      iconName: "computer" as const,
      onPress: () => setTheme("system"),
    },
  ];

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Choose how the app appears. System will match your device settings.
        </Text>
        <ButtonGroup buttons={buttons} selectedIndex={selectedIndex} />
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
