import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Credentials } from "@/components/profile/Credentials";
import { Logout } from "@/components/profile/Logout";
import { Theme } from "@/components/profile/Theme";
import { Screen } from "@/ui";

export function ProfileHome() {
  return (
    <Screen>
      <View style={styles.container}>
        <Theme />
        <Credentials />
        <Logout />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.gap(2),
  },
}));
