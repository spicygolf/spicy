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
  const me = useAccount(PlayerAccount, { resolve: { root: { player: true } } });

  // Get linked player name for subtitle
  const linkedPlayerName =
    me?.$isLoaded && me.root?.$isLoaded && me.root.player?.$isLoaded
      ? me.root.player.name
      : undefined;

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <ProfileRow
            title="Theme"
            onPress={() => navigation.navigate("ThemeScreen")}
          />
          <ProfileRow
            title="GHIN Link"
            subtitle={linkedPlayerName}
            onPress={() => navigation.navigate("GhinLinkScreen")}
          />
          <ProfileRow
            title="Account"
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
