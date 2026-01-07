import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface HoleInfo {
  number: string;
  par?: number;
  yards?: number;
  handicap?: number;
}

interface HoleHeaderProps {
  hole: HoleInfo;
  onPrevious: () => void;
  onNext: () => void;
  facility?: string;
}

export function HoleHeader({ hole, onPrevious, onNext }: HoleHeaderProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      {/* Hole Navigation Row */}
      <View style={styles.holeRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onPrevious}
          accessibilityLabel="Previous hole"
        >
          <FontAwesome6
            name="chevron-left"
            iconStyle="solid"
            size={24}
            color={theme.colors.action}
          />
        </TouchableOpacity>

        {/* Hole Info */}
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>{hole.number}</Text>
          {hole.par !== undefined &&
            hole.yards !== undefined &&
            hole.handicap !== undefined && (
              <View style={styles.holeDetails}>
                <Text style={styles.detail}>Par {hole.par}</Text>
                <Text style={styles.detailSeparator}>•</Text>
                <Text style={styles.detail}>{hole.yards} yds</Text>
                <Text style={styles.detailSeparator}>•</Text>
                <Text style={styles.detail}>Hdcp {hole.handicap}</Text>
              </View>
            )}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onNext}
          accessibilityLabel="Next hole"
        >
          <FontAwesome6
            name="chevron-right"
            iconStyle="solid"
            size={24}
            color={theme.colors.action}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
  },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.gap(0.25),
  },
  navButton: {
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  holeInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.gap(2),
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  holeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  detail: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  detailSeparator: {
    fontSize: 12,
    color: theme.colors.border,
  },
}));
