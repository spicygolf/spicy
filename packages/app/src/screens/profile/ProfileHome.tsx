import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useAccount } from "jazz-tools/react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { Logout } from "@/components/profile/Logout";
import { ProfileRow } from "@/components/profile/ProfileRow";
import type { ProfileNavigatorParamList } from "@/navigators/ProfileNavigator";
import { Screen, Text } from "@/ui";

export function ProfileHome() {
  const navigation = useNavigation<NavigationProp<ProfileNavigatorParamList>>();
  const me = useAccount(PlayerAccount, {
    resolve: { root: { player: true, settings: true } },
  });

  // Get theme setting from Jazz (capitalize first letter)
  const themeSetting =
    me?.$isLoaded && me.root?.$isLoaded && me.root.settings?.$isLoaded
      ? (me.root.settings.theme ?? "system")
      : "system";
  const currentTheme =
    themeSetting.charAt(0).toUpperCase() + themeSetting.slice(1);

  // Get linked player name for subtitle (only if linked to GHIN/catalog player)
  const linkedPlayerName =
    me?.$isLoaded &&
    me.root?.$isLoaded &&
    me.root.player?.$isLoaded &&
    me.root.player.ghinId
      ? me.root.player.name
      : undefined;

  // Show warning on Account row if recovery phrase hasn't been saved
  const isLoaded = me?.$isLoaded && me.root?.$isLoaded;
  const showAccountWarning =
    isLoaded &&
    (!me.root.$jazz.has("settings") ||
      !me.root.settings?.$isLoaded ||
      me.root.settings.recoveryPhraseSaved !== true);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <ProfileRow
            title="Theme"
            subtitle={currentTheme}
            onPress={() => navigation.navigate("ThemeScreen")}
          />
          <ProfileRow
            title="GHIN Link"
            subtitle={linkedPlayerName}
            onPress={() => navigation.navigate("GhinLinkScreen")}
          />
          <ProfileRow
            title="Account"
            showWarning={showAccountWarning}
            onPress={() => navigation.navigate("AccountScreen")}
          />
          <ProfileRow
            title="Developer Tools"
            onPress={() => navigation.navigate("DeveloperToolsScreen")}
          />
        </View>

        <View style={styles.logoutSection}>
          <Logout />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: theme.gap(2),
  },
  section: {
    flex: 1,
  },
  logoutSection: {
    paddingVertical: theme.gap(2),
  },
}));
