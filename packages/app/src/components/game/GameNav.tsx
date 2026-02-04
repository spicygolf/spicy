import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Back } from "@/components/Back";
import { Text } from "@/ui";

interface GameNavProps {
  /** Navigate to a specific screen by name instead of going back */
  backTo?: string;
  /** Whether to show the back button */
  showBack?: boolean;
  /** Header title */
  title: string;
}

/**
 * Navigation header with optional back button and centered title.
 *
 * Used in tab navigators to provide consistent header styling.
 */
export function GameNav(props: GameNavProps): React.ReactElement {
  const { backTo, showBack, title } = props;

  const left = showBack ? <Back backTo={backTo} /> : <Text />;
  const right = <Text />;

  return (
    <View style={styles.container}>
      <View style={styles.GameNav}>
        <View style={styles.left}>{left}</View>
        <View style={styles.middle}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  GameNav: {
    flexDirection: "row",
    padding: theme.gap(1),
  },
  container: {
    backgroundColor: theme.colors.background,
  },
  left: {
    flex: 1,
    justifyContent: "center",
  },
  middle: {
    flex: 5,
    justifyContent: "center",
  },
  right: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    color: theme.colors.primary,
  },
}));
