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
  runningTotal = 0,
}: TeamFooterProps) {
  const hasTeamJunk = teamJunkOptions.some((j) => j.selected);
  const hasMultipliers = multiplierOptions.length > 0;

  const handleMultiplierPress = (optionName: string): void => {
    onMultiplierToggle?.(optionName);
  };

  return (
    <View style={styles.container}>
      {/* Top row: Multiplier buttons (left) and Team junk badges (right) */}
      {(hasMultipliers || hasTeamJunk) && (
        <View style={styles.topRow}>
          {/* Left: Multiplier press buttons */}
          {hasMultipliers && (
            <View style={styles.multiplierSection}>
              <OptionsButtons
                options={multiplierOptions}
                onOptionPress={handleMultiplierPress}
              />
            </View>
          )}

          {/* Right: Team junk badges */}
          {hasTeamJunk && (
            <View style={styles.teamJunkSection}>
              <OptionsButtons
                options={teamJunkOptions.filter((j) => j.selected)}
                onOptionPress={() => {}} // Read-only
                readonly={true}
              />
            </View>
          )}
        </View>
      )}

      {/* Bottom row: Hole math and running total (always shown) */}
      <View style={styles.bottomRow}>
        {/* Left: Hole math (junk × multiplier = points) */}
        <View style={styles.holeMathSection}>
          <Text style={styles.holeMathLabel}>Hole:</Text>
          <Text style={styles.holeMathText}>
            {junkTotal} × {holeMultiplier} = {holePoints}
          </Text>
        </View>

        {/* Right: Running total */}
        <View style={styles.runningTotalSection}>
          <Text style={styles.runningTotalLabel}>Total:</Text>
          <Text style={styles.runningTotalValue}>{runningTotal}</Text>
        </View>
      </View>
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
    alignItems: "flex-end",
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.5),
    flexShrink: 1,
  },
  holeMathLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  holeMathText: {
    fontSize: 13,
    color: theme.colors.secondary,
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
