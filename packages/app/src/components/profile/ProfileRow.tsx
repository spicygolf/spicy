/**
 * Profile Row Component
 *
 * A reusable navigation row for the profile screen.
 * Shows a title with a chevron, navigates to a screen on press.
 */

import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface ProfileRowProps {
  title: string;
  subtitle?: string;
  showWarning?: boolean;
  testID?: string;
  onPress: () => void;
}

export function ProfileRow({
  title,
  subtitle,
  showWarning,
  testID,
  onPress,
}: ProfileRowProps) {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.title}>{title}</Text>
      {showWarning && (
        <View
          style={[styles.warningDot, { backgroundColor: theme.colors.error }]}
        />
      )}
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
  warningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.gap(1),
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginRight: theme.gap(1),
  },
}));
