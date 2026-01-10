import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Credentials } from "@/components/profile/Credentials";
import { RecoveryPhrase } from "@/components/profile/RecoveryPhrase";
import { Screen, Text } from "@/ui";

export function AccountScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Your account credentials and recovery information.
        </Text>
        <RecoveryPhrase />
        <Credentials />
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
