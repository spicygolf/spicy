import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ScoringWarning } from "spicylib/scoring";
import { Text } from "@/ui";
import { IncompleteIndicator } from "./IncompleteIndicator";

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
  /** Warnings for incomplete scoring on this hole */
  warnings?: ScoringWarning[];
}

export function HoleHeader({
  hole,
  onPrevious,
  onNext,
  warnings,
}: HoleHeaderProps) {
  const { theme } = useUnistyles();

  // Get the first warning message (typically "Mark all possible points")
  const warningMessage = warnings?.[0]?.message;

  return (
    <View style={styles.container}>
      {/* Hole Navigation Row */}
      <View style={styles.holeRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onPrevious}
          accessibilityLabel="Previous hole"
          testID="hole-nav-previous"
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
          <View style={styles.holeNumberRow}>
            <Text style={styles.holeNumber} testID="hole-number">
              {hole.number}
            </Text>
            {warningMessage && (
              <View style={styles.warningIndicator}>
                <IncompleteIndicator message={warningMessage} />
              </View>
            )}
          </View>
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
          testID="hole-nav-next"
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
    // Maintain consistent height whether or not hole details are shown (e.g., Summary view)
    minHeight: 48,
  },
  holeNumberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  warningIndicator: {
    marginLeft: theme.gap(1),
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
