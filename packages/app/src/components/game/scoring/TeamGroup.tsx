import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface TeamGroupProps {
  teamName?: string;
  onChangeTeams?: () => void;
  children: React.ReactNode;
}

export function TeamGroup({
  teamName,
  onChangeTeams,
  children,
}: TeamGroupProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      {/* Header - show if we have a team name or change teams button */}
      {(teamName || onChangeTeams) && (
        <View style={styles.header}>
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
    paddingVertical: theme.gap(1),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  changeTeamsButton: {
    padding: theme.gap(0.5),
  },
}));
