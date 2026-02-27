import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { memo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import { Text } from "@/ui";
import {
  getPopsCount,
  getScoreToPar,
  getScoreValue,
  getSummaryValue,
  type HoleData,
  type VerticalColumn,
  type ViewMode,
} from "./leaderboardUtils";
import { ScoreCell } from "./ScoreCell";

interface VerticalPlayerRowProps {
  playerId: string;
  firstName: string;
  lastName: string;
  rank: number;
  summaryValues: Record<string, number | null>;
  columns: VerticalColumn[];
  isExpanded: boolean;
  onToggle: () => void;
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
  playerQuotas?: Map<string, PlayerQuota> | null;
}

export const VerticalPlayerRow = memo(function VerticalPlayerRow({
  playerId,
  firstName,
  lastName,
  rank,
  summaryValues,
  columns,
  isExpanded,
  onToggle,
  holeRows,
  scoreboard,
  viewMode,
  playerQuotas,
}: VerticalPlayerRowProps) {
  const { theme } = useUnistyles();

  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <View style={styles.container}>
      {/* Summary row */}
      <Pressable
        style={styles.summaryRow}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <Text style={styles.playerName} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.valuesContainer}>
          {columns.map((col) => {
            const val = summaryValues[col.key];
            const isSkins = col.viewModeOverride === "skins";
            const effectiveMode = col.viewModeOverride ?? viewMode;
            const showColor =
              !isSkins && effectiveMode === "points" && val != null;
            return (
              <View key={col.key} style={styles.valueCell}>
                <Text
                  style={[
                    styles.valueText,
                    isSkins && styles.skinsText,
                    showColor && val > 0 && styles.positiveText,
                    showColor && val < 0 && styles.negativeText,
                  ]}
                >
                  {formatValue(val)}
                </Text>
              </View>
            );
          })}
        </View>
        <FontAwesome6
          name={isExpanded ? "chevron-down" : "chevron-right"}
          iconStyle="solid"
          size={10}
          color={theme.colors.secondary}
          style={styles.chevron}
        />
      </Pressable>

      {/* Expanded hole-by-hole detail */}
      {isExpanded && (
        <ExpandedDetail
          playerId={playerId}
          holeRows={holeRows}
          scoreboard={scoreboard}
          viewMode={viewMode}
          playerQuotas={playerQuotas}
        />
      )}
    </View>
  );
});

function formatValue(val: number | null | undefined): string {
  if (val === null || val === undefined) return "-";
  return String(val);
}

/**
 * Expanded hole-by-hole scorecard for a single player.
 * Shows holes as columns with scores below.
 */
function ExpandedDetail({
  playerId,
  holeRows,
  scoreboard,
  viewMode,
  playerQuotas,
}: {
  playerId: string;
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
  playerQuotas?: Map<string, PlayerQuota> | null;
}) {
  // Split hole rows into front 9 + Out, back 9 + In, Total
  const frontHoles = holeRows.filter(
    (r) =>
      (!r.isSummaryRow && Number.parseInt(r.hole, 10) <= 9) ||
      r.summaryType === "out",
  );
  const backHoles = holeRows.filter(
    (r) =>
      (!r.isSummaryRow && Number.parseInt(r.hole, 10) >= 10) ||
      r.summaryType === "in",
  );
  const totalRow = holeRows.find((r) => r.summaryType === "total");

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.expandedContainer}
      contentContainerStyle={styles.expandedContent}
    >
      <View>
        {/* Front 9 */}
        {frontHoles.length > 0 && (
          <HoleStrip
            holes={frontHoles}
            playerId={playerId}
            scoreboard={scoreboard}
            viewMode={viewMode}
            playerQuotas={playerQuotas}
          />
        )}
        {/* Back 9 */}
        {backHoles.length > 0 && (
          <HoleStrip
            holes={backHoles}
            playerId={playerId}
            scoreboard={scoreboard}
            viewMode={viewMode}
            playerQuotas={playerQuotas}
          />
        )}
        {/* Total */}
        {totalRow && (
          <View style={styles.totalStripRow}>
            <View style={styles.totalLabel}>
              <Text style={[styles.holeLabel, styles.summaryLabel]}>Total</Text>
            </View>
            <View style={styles.totalValue}>
              <Text style={[styles.holeLabel, styles.summaryLabel]}>
                {formatValue(
                  getSummaryValue(
                    scoreboard,
                    playerId,
                    "total",
                    viewMode,
                    playerQuotas,
                  ),
                )}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * A row of holes (front 9 or back 9) with hole labels on top and scores below.
 */
function HoleStrip({
  holes,
  playerId,
  scoreboard,
  viewMode,
  playerQuotas,
}: {
  holes: HoleData[];
  playerId: string;
  scoreboard: Scoreboard | null;
  viewMode: ViewMode;
  playerQuotas?: Map<string, PlayerQuota> | null;
}) {
  return (
    <View style={styles.stripContainer}>
      {/* Hole labels */}
      <View style={styles.stripRow}>
        {holes.map((h) => (
          <View
            key={h.hole}
            style={[
              styles.stripCell,
              h.isSummaryRow && styles.stripSummaryCell,
            ]}
          >
            <Text
              style={[styles.holeLabel, h.isSummaryRow && styles.summaryLabel]}
            >
              {h.hole}
            </Text>
          </View>
        ))}
      </View>
      {/* Score values */}
      <View style={styles.stripRow}>
        {holes.map((h) => {
          if (h.isSummaryRow && h.summaryType) {
            const val = getSummaryValue(
              scoreboard,
              playerId,
              h.summaryType,
              viewMode,
              playerQuotas,
            );
            return (
              <View key={h.hole} style={styles.stripSummaryCell}>
                <Text style={[styles.stripScoreText, styles.summaryLabel]}>
                  {formatValue(val)}
                </Text>
              </View>
            );
          }

          const value = getScoreValue(scoreboard, playerId, h.hole, viewMode);
          const scoreToPar = getScoreToPar(
            scoreboard,
            playerId,
            h.hole,
            viewMode,
          );
          const popsCount = getPopsCount(scoreboard, playerId, h.hole);

          return (
            <View key={h.hole} style={styles.stripCell}>
              <ScoreCell
                value={value}
                scoreToPar={scoreToPar}
                popsCount={popsCount}
                isSummaryRow={false}
                viewMode={viewMode}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(1.5),
    minHeight: 44,
  },
  rankBadge: {
    width: 24,
    alignItems: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.primary,
    marginLeft: theme.gap(0.5),
  },
  valuesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueCell: {
    width: 48,
    alignItems: "center",
  },
  valueText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontVariant: ["tabular-nums"],
  },
  skinsText: {
    color: theme.colors.secondary,
  },
  positiveText: {
    color: theme.colors.success,
  },
  negativeText: {
    color: theme.colors.error,
  },
  chevron: {
    marginLeft: theme.gap(0.5),
    width: 16,
    textAlign: "center",
  },
  // Expanded detail styles
  expandedContainer: {
    backgroundColor: theme.colors.card,
  },
  expandedContent: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  stripContainer: {
    marginBottom: theme.gap(0.5),
  },
  stripRow: {
    flexDirection: "row",
  },
  stripCell: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stripSummaryCell: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stripScoreText: {
    fontSize: 13,
    color: theme.colors.primary,
  },
  holeLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
    textAlign: "center",
  },
  summaryLabel: {
    fontWeight: "bold",
  },
  totalStripRow: {
    flexDirection: "row",
    marginTop: theme.gap(0.25),
    paddingTop: theme.gap(0.25),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
}));
