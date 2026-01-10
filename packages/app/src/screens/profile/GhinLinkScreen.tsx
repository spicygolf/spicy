import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { LinkGhin } from "@/components/profile/LinkGhin";
import { Screen, Text } from "@/ui";

export function GhinLinkScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Link your Spicy Golf account to your GHIN account to access your
          handicap and post scores.
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
