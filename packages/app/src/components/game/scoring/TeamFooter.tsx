import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";
import { type OptionButton, OptionsButtons } from "./OptionsButtons";
import { GolfTee } from "./TeeFlipModal";

interface TeamFooterProps {
  /** Team ID for testID generation (e2e testing) */
  teamId?: string;
  /** Team junk badges (read-only calculated junk like low_ball, low_total) */
  teamJunkOptions?: OptionButton[];
  /** Multiplier press buttons (user-toggleable) */
  multiplierOptions?: OptionButton[];
  /** Earned/automatic multipliers (read-only, like birdie_bbq) */
  earnedMultipliers?: OptionButton[];
  /** Handler for multiplier toggle */
  onMultiplierToggle?: (multiplierName: string) => void;
  /** Total junk points before multiplier */
  junkTotal?: number;
  /** Overall hole multiplier (1x, 2x, 4x, etc.) */
  holeMultiplier?: number;
  /** Total points for this hole (junkTotal × holeMultiplier) */
  holePoints?: number;
  /** Running difference vs opponent (positive = winning, negative = losing) */
  runningDiff?: number;
  /** Whether this team won the tee flip on this hole */
  teeFlipWinner?: boolean;
  /** Called when the tee flip icon is tapped to replay the animation */
  onTeeFlipReplay?: () => void;
}

export function TeamFooter({
  teamId,
  teamJunkOptions = [],
  multiplierOptions = [],
  earnedMultipliers = [],
  onMultiplierToggle,
  junkTotal = 0,
  holeMultiplier = 1,
  holePoints = 0,
  runningDiff = 0,
  teeFlipWinner = false,
  onTeeFlipReplay,
}: TeamFooterProps) {
  const { theme } = useUnistyles();
  const hasTeamJunk = teamJunkOptions.some((j) => j.selected);
  const hasMultipliers = multiplierOptions.length > 0;
  const hasEarnedMultipliers = earnedMultipliers.length > 0;

  const handleMultiplierPress = (optionName: string): void => {
    onMultiplierToggle?.(optionName);
  };

  return (
    <View style={styles.container}>
      {/* Options row: 50/50 split - Left (multipliers) / Right (junk) */}
      {(hasMultipliers ||
        hasEarnedMultipliers ||
        hasTeamJunk ||
        teeFlipWinner) && (
        <View style={styles.optionsRow}>
          {/* Left half: Tee flip icon + Multiplier press buttons + earned multipliers */}
          <View style={styles.leftSection}>
            {teeFlipWinner && (
              <Pressable
                onPress={onTeeFlipReplay}
                hitSlop={12}
                style={styles.teeFlipIcon}
                accessibilityLabel="Replay tee flip"
              >
                <GolfTee
                  color={theme.colors.primary}
                  borderColor={theme.colors.secondary}
                  scale={0.35}
                />
              </Pressable>
            )}
            {hasMultipliers && (
              <OptionsButtons
                options={multiplierOptions}
                onOptionPress={handleMultiplierPress}
              />
            )}
            {hasEarnedMultipliers && (
              <OptionsButtons
                options={earnedMultipliers}
                onOptionPress={() => {}} // Read-only
                readonly={true}
              />
            )}
          </View>

          {/* Right half: Team junk badges */}
          <View style={styles.rightSection}>
            {hasTeamJunk && (
              <OptionsButtons
                options={teamJunkOptions.filter((j) => j.selected)}
                onOptionPress={() => {}} // Read-only
                readonly={true}
                alignRight={true}
              />
            )}
          </View>
        </View>
      )}

      {/* Bottom row: Hole math and running total (always shown) */}
      <View style={styles.bottomRow}>
        {/* Left: Hole math (junk × multiplier = points) */}
        <View style={styles.holeMathSection}>
          <Text style={styles.holeMathLabel}>Hole:</Text>
          <Text style={styles.holeMathText}>
            {junkTotal} × {holeMultiplier} ={" "}
          </Text>
          <Text
            style={styles.holeMathText}
            testID={teamId ? `team-${teamId}-hole-points` : undefined}
          >
            {holePoints}
          </Text>
        </View>

        {/* Right: Running differential */}
        <View style={styles.runningDiffSection}>
          <Text
            style={styles.runningDiffValue}
            testID={teamId ? `team-${teamId}-points` : undefined}
          >
            {runningDiff > 0 ? "+" : ""}
            {runningDiff}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.75),
    gap: theme.gap(0.75),
  },
  optionsRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.gap(0.5),
    alignItems: "center",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
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
  runningDiffSection: {
    flexShrink: 0,
  },
  runningDiffValue: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  teeFlipIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.gap(0.25),
  },
}));
