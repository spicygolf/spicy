import type React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";
import type { OptionButton } from "./OptionsButtons";
import { TeamFooter } from "./TeamFooter";

interface TeamGroupProps {
  teamName?: string;
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
  children: React.ReactNode;
}

export function TeamGroup({
  teamName,
  teamJunkOptions = [],
  multiplierOptions = [],
  onMultiplierToggle,
  junkTotal,
  holeMultiplier,
  holePoints,
  runningTotal,
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

      {/* Footer - team junk, multipliers, hole math, running total */}
      <TeamFooter
        teamJunkOptions={teamJunkOptions}
        multiplierOptions={multiplierOptions}
        onMultiplierToggle={onMultiplierToggle}
        junkTotal={junkTotal}
        holeMultiplier={holeMultiplier}
        holePoints={holePoints}
        runningTotal={runningTotal}
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
