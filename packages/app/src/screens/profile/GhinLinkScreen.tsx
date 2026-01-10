import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { LinkGhin } from "@/components/profile/LinkGhin";
import { Screen, Text } from "@/ui";

export function GhinLinkScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Link your account to your GHIN player record to access your handicap
          and imported games.
        </Text>
        <LinkGhin />
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
