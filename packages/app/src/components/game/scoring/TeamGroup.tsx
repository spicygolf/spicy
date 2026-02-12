import type React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";
import type { OptionButton } from "./OptionsButtons";
import { TeamFooter } from "./TeamFooter";

interface TeamGroupProps {
  /** Team ID for testID generation (e2e testing) */
  teamId?: string;
  teamName?: string;
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
  /** Whether the tee flip was declined on this hole (shown as dimmed tee icon) */
  teeFlipDeclined?: boolean;
  /** Called when the declined tee icon is tapped to undo the decline */
  onTeeFlipUndoDecline?: () => void;
  children: React.ReactNode;
}

export function TeamGroup({
  teamId,
  teamName,
  teamJunkOptions = [],
  multiplierOptions = [],
  earnedMultipliers = [],
  onMultiplierToggle,
  junkTotal,
  holeMultiplier,
  holePoints,
  runningDiff,
  teeFlipWinner,
  onTeeFlipReplay,
  teeFlipDeclined,
  onTeeFlipUndoDecline,
  children,
}: TeamGroupProps) {
  return (
    <View style={styles.container}>
      {/* Header - show only if we have a team name (for visual separation) */}
      {teamName && (
        <View style={styles.header}>
          <Text style={styles.teamName}>{teamName}</Text>
        </View>
      )}

      {/* Team members */}
      {children}

      {/* Footer - team junk, multipliers, hole math, running diff */}
      <TeamFooter
        teamId={teamId}
        teamJunkOptions={teamJunkOptions}
        multiplierOptions={multiplierOptions}
        earnedMultipliers={earnedMultipliers}
        onMultiplierToggle={onMultiplierToggle}
        junkTotal={junkTotal}
        holeMultiplier={holeMultiplier}
        holePoints={holePoints}
        runningDiff={runningDiff}
        teeFlipWinner={teeFlipWinner}
        onTeeFlipReplay={onTeeFlipReplay}
        teeFlipDeclined={teeFlipDeclined}
        onTeeFlipUndoDecline={onTeeFlipUndoDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginHorizontal: theme.gap(1),
    marginVertical: theme.gap(1),
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 40,
    justifyContent: "center",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
    textAlign: "center",
  },
}));
