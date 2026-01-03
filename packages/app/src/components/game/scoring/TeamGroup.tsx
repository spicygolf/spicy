import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";
import { type OptionButton, OptionsButtons } from "./OptionsButtons";

interface TeamGroupProps {
  teamName?: string;
  onChangeTeams?: () => void;
  multiplierOptions?: OptionButton[];
  teamJunkOptions?: OptionButton[];
  onMultiplierToggle?: (multiplierName: string) => void;
  children: React.ReactNode;
}

export function TeamGroup({
  teamName,
  onChangeTeams,
  multiplierOptions = [],
  teamJunkOptions = [],
  onMultiplierToggle,
  children,
}: TeamGroupProps) {
  const { theme } = useUnistyles();

  const handleMultiplierPress = (optionName: string): void => {
    onMultiplierToggle?.(optionName);
  };

  // Team junk options are read-only (calculated, not toggleable)
  const handleTeamJunkPress = (_optionName: string): void => {
    // No-op: calculated junk cannot be toggled
  };

  // Check if we should show header
  const hasHeaderContent =
    teamName ||
    onChangeTeams ||
    multiplierOptions.length > 0 ||
    teamJunkOptions.some((j) => j.selected);

  return (
    <View style={styles.container}>
      {/* Header - show if we have a team name, change teams button, multipliers, or active team junk */}
      {hasHeaderContent && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {teamName && <Text style={styles.teamName}>{teamName}</Text>}
            {onChangeTeams && (
              <TouchableOpacity
                style={styles.changeTeamsButton}
                onPress={onChangeTeams}
                accessibilityLabel="Change teams"
              >
                <FontAwesome6
                  name="people-group"
                  iconStyle="solid"
                  size={18}
                  color={theme.colors.action}
                />
              </TouchableOpacity>
            )}

            {/* Team junk (low_ball, low_team) - only show when selected */}
            {teamJunkOptions.some((j) => j.selected) && (
              <View style={styles.teamJunkSection}>
                <OptionsButtons
                  options={teamJunkOptions.filter((j) => j.selected)}
                  onOptionPress={handleTeamJunkPress}
                  readonly={true}
                />
              </View>
            )}
          </View>

          {/* Multipliers on the right side of header */}
          {multiplierOptions.length > 0 && (
            <View style={styles.multiplierSection}>
              <OptionsButtons
                options={multiplierOptions}
                onOptionPress={handleMultiplierPress}
              />
            </View>
          )}
        </View>
      )}

      {/* Team members */}
      {children}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(0.5),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 40,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  changeTeamsButton: {
    padding: theme.gap(0.5),
  },
  teamJunkSection: {
    marginLeft: theme.gap(1),
  },
  multiplierSection: {
    flexShrink: 0,
  },
}));
