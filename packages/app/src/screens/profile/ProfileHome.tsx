import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Credentials } from "@/components/profile/Credentials";
import { DeveloperTools } from "@/components/profile/DeveloperTools";
import { LinkGhin } from "@/components/profile/LinkGhin";
import { Logout } from "@/components/profile/Logout";
import { RecoveryPhrase } from "@/components/profile/RecoveryPhrase";
import { Theme } from "@/components/profile/Theme";
import { Screen } from "@/ui";

export function ProfileHome() {
  return (
    <Screen>
      <View style={styles.container}>
        <Theme />
        <LinkGhin />
        <Credentials />
        <RecoveryPhrase />
        <DeveloperTools />
        <Logout />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
