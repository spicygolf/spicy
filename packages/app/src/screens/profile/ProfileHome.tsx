import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Credentials } from "@/components/profile/Credentials";
import { DeveloperTools } from "@/components/profile/DeveloperTools";
import { Logout } from "@/components/profile/Logout";
import { Theme } from "@/components/profile/Theme";
import { Screen } from "@/ui";

export function ProfileHome() {
  return (
    <Screen>
      <View style={styles.container}>
        <Theme />
        <Credentials />
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
