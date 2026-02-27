import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { memo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import { isHoleComplete } from "spicylib/scoring";
import { Text } from "@/ui";
import {
  getPopsCount,
  getScoreToPar,
  getScoreValue,
  getSummaryValue,
  type HoleData,
  type VerticalColumn,
} from "./leaderboardUtils";
import { ScoreCell } from "./ScoreCell";

interface VerticalPlayerRowProps {
  playerId: string;
  firstName: string;
  lastName: string;
  rankLabel: string;
  summaryValues: Record<string, number | null>;
  columns: VerticalColumn[];
  isExpanded: boolean;
  onToggle: () => void;
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
  playerQuotas?: Map<string, PlayerQuota> | null;
}

export const VerticalPlayerRow = memo(function VerticalPlayerRow({
  playerId,
  firstName,
  lastName,
  rankLabel,
  summaryValues,
  columns,
  isExpanded,
  onToggle,
  holeRows,
  scoreboard,
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
          <Text style={styles.rankText}>{rankLabel}</Text>
        </View>
        <Text style={styles.playerName} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.valuesContainer}>
          {columns.map((col) => {
            const val = summaryValues[col.key];
            const isSkins = col.viewModeOverride === "skins";
            const showColor = !isSkins && val != null;
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
 * Shows gross score with birdie/bogey decoration, stableford points
 * as superscript, and skin indicator as subscript dot.
 */
function ExpandedDetail({
  playerId,
  holeRows,
  scoreboard,
  playerQuotas,
}: {
  playerId: string;
  holeRows: HoleData[];
  scoreboard: Scoreboard | null;
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
            playerQuotas={playerQuotas}
          />
        )}
        {/* Back 9 */}
        {backHoles.length > 0 && (
          <HoleStrip
            holes={backHoles}
            playerId={playerId}
            scoreboard={scoreboard}
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
                  getSummaryValue(scoreboard, playerId, "total", "gross"),
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
 * Get stableford points for a player on a hole.
 * Returns null if hole is incomplete or no score.
 */
function getStablefordPoints(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
  playerQuotas: Map<string, PlayerQuota> | null | undefined,
): number | null {
  if (!scoreboard) return null;
  const holeResult = scoreboard.holes[hole];
  if (!holeResult || !isHoleComplete(holeResult)) return null;
  const playerResult = holeResult.players[playerId];
  if (!playerResult || !playerResult.hasScore) return null;
  return playerResult.points;
}

/**
 * Check if a player won a skin on a hole.
 */
function hasSkin(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
): boolean {
  if (!scoreboard) return false;
  const holeResult = scoreboard.holes[hole];
  if (!holeResult || !isHoleComplete(holeResult)) return false;
  const playerResult = holeResult.players[playerId];
  if (!playerResult) return false;
  return playerResult.junk.some((j) => j.name.endsWith("_skin"));
}

/**
 * A row of holes (front 9 or back 9) with hole labels on top and rich scores below.
 * Each cell shows: gross score with decoration, stableford points superscript, skin dot.
 */
function HoleStrip({
  holes,
  playerId,
  scoreboard,
  playerQuotas,
}: {
  holes: HoleData[];
  playerId: string;
  scoreboard: Scoreboard | null;
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
              "gross",
            );
            return (
              <View key={h.hole} style={styles.stripSummaryCell}>
                <Text style={[styles.stripScoreText, styles.summaryLabel]}>
                  {formatValue(val)}
                </Text>
              </View>
            );
          }

          // Gross score with decoration
          const grossValue = getScoreValue(
            scoreboard,
            playerId,
            h.hole,
            "gross",
          );
          const scoreToPar = getScoreToPar(
            scoreboard,
            playerId,
            h.hole,
            "gross",
          );
          const popsCount = getPopsCount(scoreboard, playerId, h.hole);

          // Stableford points (superscript)
          const points = getStablefordPoints(
            scoreboard,
            playerId,
            h.hole,
            playerQuotas,
          );

          // Skin indicator (subscript)
          const wonSkin = hasSkin(scoreboard, playerId, h.hole);

          return (
            <View key={h.hole} style={styles.stripCell}>
              <View style={styles.richCell}>
                {/* Stableford points — top-right superscript */}
                <View style={styles.superscript}>
                  {points != null && (
                    <Text style={styles.superscriptText}>{points}</Text>
                  )}
                </View>
                {/* Gross score with decoration */}
                <ScoreCell
                  value={grossValue}
                  scoreToPar={scoreToPar}
                  popsCount={popsCount}
                  isSummaryRow={false}
                  viewMode="gross"
                />
                {/* Skin indicator — bottom-right subscript */}
                <View style={styles.subscript}>
                  {wonSkin && <View style={styles.skinDot} />}
                </View>
              </View>
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
    width: 28,
    alignItems: "center",
  },
  rankText: {
    fontSize: 12,
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
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
  },
  stripContainer: {
    marginBottom: theme.gap(0.25),
  },
  stripRow: {
    flexDirection: "row",
  },
  stripCell: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stripSummaryCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stripScoreText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  holeLabel: {
    fontSize: 10,
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
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  totalValue: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  // Rich cell: gross score + stableford superscript + skin subscript
  richCell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  superscript: {
    position: "absolute",
    top: 1,
    left: 0,
    zIndex: 1,
  },
  superscriptText: {
    fontSize: 8,
    color: theme.colors.success,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  subscript: {
    position: "absolute",
    bottom: 2,
    left: 2,
  },
  skinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.warning,
  },
}));
