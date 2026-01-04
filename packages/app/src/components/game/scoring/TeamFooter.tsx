import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";
import { type OptionButton, OptionsButtons } from "./OptionsButtons";

interface TeamFooterProps {
  /** Team junk badges (read-only calculated junk like low_ball, low_total) */
  teamJunkOptions?: OptionButton[];
  /** Multiplier press buttons (user-toggleable) */
  multiplierOptions?: OptionButton[];
  /** Handler for multiplier toggle */
  onMultiplierToggle?: (multiplierName: string) => void;
  /** Total junk points before multiplier */
  junkTotal?: number;
  /** Overall hole multiplier (1x, 2x, 4x, etc.) */
  holeMultiplier?: number;
  /** Total points for this hole (junkTotal × holeMultiplier) */
  holePoints?: number;
  /** Running total points through this hole */
  runningTotal?: number;
}

export function TeamFooter({
  teamJunkOptions = [],
  multiplierOptions = [],
  onMultiplierToggle,
  junkTotal = 0,
  holeMultiplier = 1,
  holePoints = 0,
  runningTotal,
}: TeamFooterProps) {
  const hasTeamJunk = teamJunkOptions.some((j) => j.selected);
  const hasMultipliers = multiplierOptions.length > 0;
  const hasHoleMath = junkTotal > 0 || holePoints > 0;

  // Don't render if there's nothing to show
  if (
    !hasTeamJunk &&
    !hasMultipliers &&
    !hasHoleMath &&
    runningTotal === undefined
  ) {
    return null;
  }

  const handleMultiplierPress = (optionName: string): void => {
    onMultiplierToggle?.(optionName);
  };

  return (
    <View style={styles.container}>
      {/* Top row: Team junk badges and multiplier buttons */}
      {(hasTeamJunk || hasMultipliers) && (
        <View style={styles.topRow}>
          {/* Left: Team junk badges */}
          {hasTeamJunk && (
            <View style={styles.teamJunkSection}>
              <OptionsButtons
                options={teamJunkOptions.filter((j) => j.selected)}
                onOptionPress={() => {}} // Read-only
                readonly={true}
              />
            </View>
          )}

          {/* Right: Multiplier press buttons */}
          {hasMultipliers && (
            <View style={styles.multiplierSection}>
              <OptionsButtons
                options={multiplierOptions}
                onOptionPress={handleMultiplierPress}
              />
            </View>
          )}
        </View>
      )}

      {/* Bottom row: Hole math and running total */}
      {(hasHoleMath || runningTotal !== undefined) && (
        <View style={styles.bottomRow}>
          {/* Left: Hole math (junk × multiplier = points) */}
          {hasHoleMath && (
            <View style={styles.holeMathSection}>
              <Text style={styles.holeMathText}>
                {junkTotal} × {holeMultiplier}x = {holePoints}
              </Text>
            </View>
          )}

          {/* Right: Running total */}
          {runningTotal !== undefined && (
            <View style={styles.runningTotalSection}>
              <Text style={styles.runningTotalLabel}>Total:</Text>
              <Text style={styles.runningTotalValue}>{runningTotal}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.75),
    gap: theme.gap(0.75),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(1),
  },
  teamJunkSection: {
    flexShrink: 1,
    flexGrow: 1,
  },
  multiplierSection: {
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.gap(1),
  },
  holeMathSection: {
    flexShrink: 1,
  },
  holeMathText: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontFamily: "monospace",
  },
  runningTotalSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.5),
    flexShrink: 0,
  },
  runningTotalLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  runningTotalValue: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
}));
