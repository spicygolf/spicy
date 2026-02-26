import { memo, useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import { Text } from "@/ui";
import {
  getVerticalColumns,
  getVerticalPlayerData,
  type HoleData,
  type PlayerColumn,
  type ViewMode,
} from "./leaderboardUtils";
import { VerticalPlayerRow } from "./VerticalPlayerRow";

interface VerticalLeaderboardProps {
  playerColumns: PlayerColumn[];
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
  playerQuotas?: Map<string, PlayerQuota> | null;
  isQuotaGame: boolean;
}

export const VerticalLeaderboard = memo(function VerticalLeaderboard({
  playerColumns,
  holeRows,
  scoreboard,
  viewMode,
  playerQuotas,
  isQuotaGame,
}: VerticalLeaderboardProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const columns = useMemo(() => getVerticalColumns(isQuotaGame), [isQuotaGame]);

  const playerData = useMemo(
    () =>
      getVerticalPlayerData(
        scoreboard,
        playerColumns,
        viewMode,
        playerQuotas,
        isQuotaGame,
      ),
    [scoreboard, playerColumns, viewMode, playerQuotas, isQuotaGame],
  );

  const handleToggle = useCallback((playerId: string) => {
    setExpandedPlayerId((prev) => (prev === playerId ? null : playerId));
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerPlayerCell}>
          <Text style={styles.headerText}>Player</Text>
        </View>
        <View style={styles.headerValues}>
          {columns.map((col) => (
            <View key={col.key} style={styles.headerValueCell}>
              <Text style={styles.headerText}>{col.label}</Text>
            </View>
          ))}
        </View>
        {/* Spacer for chevron width */}
        <View style={styles.headerChevronSpacer} />
      </View>

      {/* Player rows */}
      {playerData.map((player) => (
        <VerticalPlayerRow
          key={player.playerId}
          playerId={player.playerId}
          firstName={player.firstName}
          lastName={player.lastName}
          rank={player.rank}
          summaryValues={player.values}
          columns={columns}
          isExpanded={expandedPlayerId === player.playerId}
          onToggle={() => handleToggle(player.playerId)}
          holeRows={holeRows}
          scoreboard={scoreboard}
          viewMode={viewMode}
          playerQuotas={playerQuotas}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerPlayerCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    // Account for rank badge width (24) + marginLeft (4)
    paddingLeft: 28,
  },
  headerValues: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerValueCell: {
    width: 48,
    alignItems: "center",
  },
  headerChevronSpacer: {
    width: 24,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
    textTransform: "uppercase",
  },
}));
