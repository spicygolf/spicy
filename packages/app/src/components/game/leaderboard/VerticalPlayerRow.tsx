import { memo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
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
          <TotalStrip
            playerId={playerId}
            scoreboard={scoreboard}
            playerQuotas={playerQuotas}
          />
        )}
      </View>
    </ScrollView>
  );
}

/**
 * Get stableford points for a player on a hole (excluding skin awards).
 * Returns null if hole is incomplete or no score.
 */
function getStablefordPoints(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
): number | null {
  if (!scoreboard) return null;
  const holeResult = scoreboard.holes[hole];
  if (!holeResult || !isHoleComplete(holeResult)) return null;
  const playerResult = holeResult.players[playerId];
  if (!playerResult || !playerResult.hasScore) return null;
  // Sum only stableford junk, excluding skins and other junk
  let total = 0;
  for (const junk of playerResult.junk) {
    if (junk.name.startsWith("stableford_")) {
      total += junk.value;
    }
  }
  return total > 0 ? total : null;
}

/**
 * Get stableford total for a player across a range of holes.
 * "out" = holes 1-9, "in" = holes 10-18, "total" = all.
 */
function getStablefordTotal(
  scoreboard: Scoreboard | null,
  playerId: string,
  summaryType: "out" | "in" | "total",
): number | null {
  if (!scoreboard) return null;
  let total = 0;
  let hasAny = false;
  for (const [hole, holeResult] of Object.entries(scoreboard.holes)) {
    const holeNum = Number.parseInt(hole, 10);
    if (Number.isNaN(holeNum)) continue;
    const inRange =
      summaryType === "out"
        ? holeNum >= 1 && holeNum <= 9
        : summaryType === "in"
          ? holeNum >= 10 && holeNum <= 18
          : true;
    if (!inRange || !isHoleComplete(holeResult)) continue;
    const playerResult = holeResult.players[playerId];
    if (!playerResult || !playerResult.hasScore) continue;
    for (const junk of playerResult.junk) {
      if (junk.name.startsWith("stableford_")) {
        total += junk.value;
        hasAny = true;
      }
    }
  }
  return hasAny ? total : null;
}

/**
 * Get running total (quota performance) for a player across a range.
 * Returns stableford points minus quota for the range, or just stableford
 * total if no quotas are available.
 */
function getRunningTotal(
  scoreboard: Scoreboard | null,
  playerId: string,
  summaryType: "out" | "in" | "total",
  playerQuotas: Map<string, PlayerQuota> | null | undefined,
): number | null {
  const stableford = getStablefordTotal(scoreboard, playerId, summaryType);
  if (stableford === null) return null;

  const quota = playerQuotas?.get(playerId);
  if (!quota || !scoreboard) return stableford;

  // Align quota halves to physical course sides (same logic as getSummaryValue)
  const firstHole = scoreboard.meta.holesPlayed[0];
  const startsOnBack =
    firstHole !== undefined && Number.parseInt(firstHole, 10) >= 10;
  const outQuota = startsOnBack ? quota.back : quota.front;
  const inQuota = startsOnBack ? quota.front : quota.back;

  const quotaValue =
    summaryType === "out"
      ? outQuota
      : summaryType === "in"
        ? inQuota
        : quota.total;
  return stableford - quotaValue;
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
            const summaryPts = getStablefordTotal(
              scoreboard,
              playerId,
              h.summaryType,
            );
            const running = getRunningTotal(
              scoreboard,
              playerId,
              h.summaryType,
              playerQuotas,
            );
            return (
              <View key={h.hole} style={styles.stripSummaryCell}>
                <View style={styles.richCell}>
                  <View style={styles.superscript}>
                    {summaryPts != null && (
                      <Text style={styles.superscriptText}>{summaryPts}</Text>
                    )}
                  </View>
                  <ScoreCell
                    value={val}
                    scoreToPar={null}
                    popsCount={0}
                    isSummaryRow={true}
                    viewMode="gross"
                  />
                  <View style={styles.subscript}>
                    {running != null && (
                      <Text style={styles.subscriptText}>
                        {running > 0 ? `+${running}` : String(running)}
                      </Text>
                    )}
                  </View>
                </View>
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

          // Stableford points (superscript) — excludes skin awards
          const points = getStablefordPoints(scoreboard, playerId, h.hole);

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

/**
 * Total row with gross total, stableford superscript, and running total subscript.
 */
function TotalStrip({
  playerId,
  scoreboard,
  playerQuotas,
}: {
  playerId: string;
  scoreboard: Scoreboard | null;
  playerQuotas?: Map<string, PlayerQuota> | null;
}) {
  const grossTotal = getSummaryValue(scoreboard, playerId, "total", "gross");
  const totalPts = getStablefordTotal(scoreboard, playerId, "total");
  const running = getRunningTotal(scoreboard, playerId, "total", playerQuotas);

  return (
    <View style={styles.totalStripRow}>
      <View style={styles.totalLabel}>
        <Text style={[styles.holeLabel, styles.summaryLabel]}>Total</Text>
      </View>
      <View style={styles.stripSummaryCell}>
        <View style={styles.richCell}>
          <View style={styles.superscript}>
            {totalPts != null && (
              <Text style={styles.superscriptText}>{totalPts}</Text>
            )}
          </View>
          <ScoreCell
            value={grossTotal}
            scoreToPar={null}
            popsCount={0}
            isSummaryRow={true}
            viewMode="gross"
          />
          <View style={styles.subscript}>
            {running != null && (
              <Text style={styles.subscriptText}>
                {running > 0 ? `+${running}` : String(running)}
              </Text>
            )}
          </View>
        </View>
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
    paddingHorizontal: theme.gap(1),
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
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 2,
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
    width: 56,
    alignItems: "stretch",
    justifyContent: "center",
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
  // Rich cell: gross score + stableford superscript + skin/running subscript
  richCell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  superscript: {
    position: "absolute",
    top: 2,
    right: 4,
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
    bottom: 3,
    right: 4,
  },
  subscriptText: {
    fontSize: 8,
    color: theme.colors.secondary,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  skinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.warning,
  },
}));
