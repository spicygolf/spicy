import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";
import type { ViewMode } from "./leaderboardUtils";

/** Spacing between pops dots in pixels */
const POPS_DOT_SPACING = 5;
/** Maximum number of pops dots to display */
const MAX_POPS_DOTS = 3;

type ScoreDecoration =
  | "double-circle"
  | "single-circle"
  | "double-square"
  | "single-square"
  | null;

function getScoreDecoration(scoreToPar: number): ScoreDecoration {
  if (scoreToPar <= -2) return "double-circle"; // Eagle or better
  if (scoreToPar === -1) return "single-circle"; // Birdie
  if (scoreToPar === 0) return null; // Par
  if (scoreToPar === 1) return "single-square"; // Bogey
  if (scoreToPar >= 2) return "double-square"; // Double bogey or worse
  return null;
}

interface ScoreCellProps {
  value: number | null;
  scoreToPar: number | null;
  popsCount: number;
  isSummaryRow: boolean;
  viewMode: ViewMode;
}

/**
 * Score cell with circle/square notation for birdies/bogeys
 * and pops dots for handicap strokes
 */
export function ScoreCell({
  value,
  scoreToPar,
  popsCount,
  isSummaryRow,
  viewMode,
}: ScoreCellProps): React.JSX.Element {
  const { theme } = useUnistyles();

  if (value === null) {
    return <View style={styles.scoreCell} />;
  }

  // Format value
  let displayValue = String(value);
  if (viewMode === "points" && value > 0) {
    displayValue = `+${value}`;
  } else if (viewMode === "points" && value < 0) {
    displayValue = String(value);
  }

  // Get decoration for gross/net views (not points, not summary)
  const decoration =
    !isSummaryRow && viewMode !== "points" && scoreToPar !== null
      ? getScoreDecoration(scoreToPar)
      : null;

  // Use primary color for decoration borders (matches screenshots)
  const borderColor = theme.colors.primary;

  // Render pops dots (1, 2, or 3 strokes)
  const popsDots = [];
  for (let i = 0; i < Math.min(popsCount, MAX_POPS_DOTS); i++) {
    popsDots.push(
      <View
        key={i}
        style={[styles.popsDot, { top: 1 + i * POPS_DOT_SPACING }]}
      />,
    );
  }

  return (
    <View style={styles.scoreCell}>
      {/* Pops dots - indicate handicap strokes on this hole */}
      {popsDots}

      {/* Score with decoration */}
      {decoration === "double-circle" ? (
        <View style={[styles.outerCircle, { borderColor }]}>
          <View style={[styles.innerCircle, { borderColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        </View>
      ) : decoration === "single-circle" ? (
        <View style={[styles.singleCircle, { borderColor }]}>
          <Text style={styles.scoreCellText}>{displayValue}</Text>
        </View>
      ) : decoration === "double-square" ? (
        <View style={[styles.outerSquare, { borderColor }]}>
          <View style={[styles.innerSquare, { borderColor }]}>
            <Text style={styles.scoreCellText}>{displayValue}</Text>
          </View>
        </View>
      ) : decoration === "single-square" ? (
        <View style={[styles.singleSquare, { borderColor }]}>
          <Text style={styles.scoreCellText}>{displayValue}</Text>
        </View>
      ) : (
        <Text style={styles.scoreCellText}>{displayValue}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  scoreCell: {
    width: 44,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scoreCellText: {
    fontSize: 13,
    color: theme.colors.primary,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  // Circle decorations (birdie/eagle)
  outerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  singleCircle: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Square decorations (bogey/double)
  outerSquare: {
    width: 22,
    height: 22,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerSquare: {
    width: 17,
    height: 17,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  singleSquare: {
    width: 19,
    height: 19,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Pops dot - indicates player receives handicap stroke on this hole
  popsDot: {
    position: "absolute",
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
}));
