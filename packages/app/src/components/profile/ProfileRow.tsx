/**
 * Profile Row Component
 *
 * A reusable navigation row for the profile screen.
 * Shows a title with a chevron, navigates to a screen on press.
 */

import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface ProfileRowProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function ProfileRow({ title, subtitle, onPress }: ProfileRowProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <FontAwesome6
        name="chevron-right"
        iconStyle="solid"
        size={16}
        color={theme.colors.secondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginRight: theme.gap(1),
  },
}));
