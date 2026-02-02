import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

export type ScoreInputSize = "sm" | "md" | "lg" | "xl";

interface ScoreInputProps {
  gross: number | null;
  net: number | null;
  par: number;
  netPar: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onScoreTap?: () => void;
  onUnscore?: () => void;
  readonly?: boolean;
  size?: ScoreInputSize;
  /** Player ID for testID generation (e2e testing) */
  playerId?: string;
}

// Base dimensions at scale 1.0
const BASE = {
  button: 36,
  buttonBorder: 1.5,
  outerShape: 56,
  innerShape: 48,
  shapeBorder: 2,
  outerRadius: 28, // circle
  innerRadius: 24, // circle
  outerSquareRadius: 8,
  innerSquareRadius: 6,
  scoreFont: 32,
  grossNetFont: 22,
  separatorFont: 24,
  labelFont: 11,
  iconSize: 16,
  minWidth: 80,
  minHeight: 56,
  labelHeight: 18,
};

// Scale factors for each size
const SCALE_FACTORS: Record<ScoreInputSize, number> = {
  sm: 0.6,
  md: 0.75,
  lg: 1,
  xl: 1.25,
};

function getScaledDimensions(size: ScoreInputSize) {
  const scale = SCALE_FACTORS[size];
  return {
    button: Math.round(BASE.button * scale),
    buttonBorder: Math.round(BASE.buttonBorder * scale * 10) / 10,
    buttonRadius: Math.round((BASE.button * scale) / 2),
    outerShape: Math.round(BASE.outerShape * scale),
    innerShape: Math.round(BASE.innerShape * scale),
    shapeBorder: Math.round(BASE.shapeBorder * scale),
    outerRadius: Math.round(BASE.outerRadius * scale),
    innerRadius: Math.round(BASE.innerRadius * scale),
    outerSquareRadius: Math.round(BASE.outerSquareRadius * scale),
    innerSquareRadius: Math.round(BASE.innerSquareRadius * scale),
    scoreFont: Math.round(BASE.scoreFont * scale),
    grossNetFont: Math.round(BASE.grossNetFont * scale),
    separatorFont: Math.round(BASE.separatorFont * scale),
    labelFont: Math.round(BASE.labelFont * scale),
    iconSize: Math.round(BASE.iconSize * scale),
    minWidth: Math.round(BASE.minWidth * scale),
    minHeight: Math.round(BASE.minHeight * scale),
    labelHeight: Math.round(BASE.labelHeight * scale),
  };
}

export function ScoreInput({
  gross,
  net,
  par,
  netPar,
  onIncrement,
  onDecrement,
  onScoreTap,
  onUnscore,
  readonly = false,
  size = "md",
  playerId,
}: ScoreInputProps) {
  const { theme } = useUnistyles();
  const dim = getScaledDimensions(size);

  // Determine if score has been modified
  const hasScore = gross !== null;
  const isUnmodified = !hasScore;

  // Calculate score-to-par and get display info
  const scoreToPar = gross !== null ? gross - par : 0;
  const { label, color } = getScoreToParInfo(scoreToPar, theme.colors.score);

  // Display values - show net par as default when unscored
  // If unscored: show gross that would result in net par (par + pops)
  const displayGross = hasScore ? gross : par + (par - netPar); // par + pops
  // When unscored, display the hole's par as the net (which is what net par means)
  const displayNet = hasScore ? (net ?? netPar) : par;
  const showNet = displayNet !== displayGross;

  const handleDecrement = (): void => {
    onDecrement();
  };

  const handleIncrement = (): void => {
    onIncrement();
  };

  const handleScoreTap = (): void => {
    if (onScoreTap) {
      onScoreTap();
    }
    // When no score exists, tapping activates at par (handled by parent)
    // When score exists, tapping does nothing
  };

  const handleLongPress = (): void => {
    if (onUnscore && gross !== null) {
      onUnscore();
    }
  };

  // Determine decoration type based on score-to-par
  const decoration = getScoreDecoration(scoreToPar);

  // Dynamic styles based on size
  const dynamicStyles = {
    button: {
      width: dim.button,
      height: dim.button,
      borderRadius: dim.buttonRadius,
      borderWidth: dim.buttonBorder,
    },
    scoreContainer: {
      minWidth: dim.minWidth,
    },
    scoreContentWrapper: {
      minHeight: dim.minHeight,
    },
    outerCircle: {
      width: dim.outerShape,
      height: dim.outerShape,
      borderWidth: dim.shapeBorder,
      borderRadius: dim.outerRadius,
    },
    innerCircle: {
      width: dim.innerShape,
      height: dim.innerShape,
      borderWidth: dim.shapeBorder,
      borderRadius: dim.innerRadius,
    },
    outerSquare: {
      width: dim.outerShape,
      height: dim.outerShape,
      borderWidth: dim.shapeBorder,
      borderRadius: dim.outerSquareRadius,
    },
    innerSquare: {
      width: dim.innerShape,
      height: dim.innerShape,
      borderWidth: dim.shapeBorder,
      borderRadius: dim.innerSquareRadius,
    },
    scoreText: {
      fontSize: dim.scoreFont,
    },
    grossText: {
      fontSize: dim.grossNetFont,
    },
    separatorText: {
      fontSize: dim.separatorFont,
    },
    netText: {
      fontSize: dim.grossNetFont,
    },
    labelContainer: {
      height: dim.labelHeight,
    },
    labelText: {
      fontSize: dim.labelFont,
    },
  };

  const renderScoreNumber = (): React.ReactElement => {
    if (showNet) {
      return (
        <View style={styles.scoreRow}>
          <Text
            style={[
              styles.grossText,
              dynamicStyles.grossText,
              isUnmodified && styles.scoreTextUnmodified,
            ]}
          >
            {displayGross}
          </Text>
          <Text
            style={[
              styles.separator,
              dynamicStyles.separatorText,
              isUnmodified && styles.scoreTextUnmodified,
            ]}
          >
            /
          </Text>
          <Text
            style={[
              styles.netText,
              dynamicStyles.netText,
              isUnmodified && styles.scoreTextUnmodified,
            ]}
          >
            {displayNet}
          </Text>
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.scoreText,
          dynamicStyles.scoreText,
          isUnmodified && styles.scoreTextUnmodified,
        ]}
      >
        {displayGross}
      </Text>
    );
  };

  return (
    <View>
      <View style={styles.container}>
        {/* Decrement Button */}
        <TouchableOpacity
          style={[
            styles.button,
            dynamicStyles.button,
            readonly && styles.buttonDisabled,
          ]}
          onPress={handleDecrement}
          disabled={readonly || (gross !== null && gross <= 1)}
          accessibilityLabel="Decrease score"
          testID={playerId ? `player-${playerId}-decrement` : undefined}
        >
          <FontAwesome6
            name="minus"
            iconStyle="solid"
            size={dim.iconSize}
            color={
              readonly || (gross !== null && gross <= 1)
                ? theme.colors.border
                : theme.colors.action
            }
          />
        </TouchableOpacity>

        {/* Score Display - Tappable */}
        <TouchableOpacity
          style={[styles.scoreContainer, dynamicStyles.scoreContainer]}
          onPress={handleScoreTap}
          onLongPress={handleLongPress}
          disabled={readonly}
          activeOpacity={0.6}
          accessibilityLabel={`Score: ${displayGross}${showNet ? ` net ${displayNet}` : ""}`}
          testID={playerId ? `player-${playerId}-score` : undefined}
        >
          {/* Fixed height container to prevent vertical shifting */}
          <View
            style={[
              styles.scoreContentWrapper,
              dynamicStyles.scoreContentWrapper,
            ]}
          >
            {/* Score number wrapper with decorations - always present */}
            <View style={styles.scoreNumberWrapper}>
              {/* Always render circle structure for par/birdie/eagle/albatross */}
              {(decoration === "double-circle" ||
                decoration === "single-circle" ||
                decoration === null) && (
                <View
                  style={[
                    styles.outerCircle,
                    dynamicStyles.outerCircle,
                    {
                      borderColor:
                        decoration === "double-circle" ? color : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerCircle,
                      dynamicStyles.innerCircle,
                      {
                        borderColor:
                          decoration === "single-circle" ||
                          decoration === "double-circle"
                            ? color
                            : "transparent",
                      },
                    ]}
                  >
                    {renderScoreNumber()}
                  </View>
                </View>
              )}
              {/* Always render square structure for bogeys */}
              {(decoration === "double-square" ||
                decoration === "single-square") && (
                <View
                  style={[
                    styles.outerSquare,
                    dynamicStyles.outerSquare,
                    {
                      borderColor:
                        decoration === "double-square" ? color : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerSquare,
                      dynamicStyles.innerSquare,
                      { borderColor: color },
                    ]}
                  >
                    {renderScoreNumber()}
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Increment Button */}
        <TouchableOpacity
          style={[
            styles.button,
            dynamicStyles.button,
            readonly && styles.buttonDisabled,
          ]}
          onPress={handleIncrement}
          disabled={readonly || (gross !== null && gross >= 12)}
          accessibilityLabel="Increase score"
          testID={playerId ? `player-${playerId}-increment` : undefined}
        >
          <FontAwesome6
            name="plus"
            iconStyle="solid"
            size={dim.iconSize}
            color={
              readonly || (gross !== null && gross >= 12)
                ? theme.colors.border
                : theme.colors.action
            }
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.labelContainer, dynamicStyles.labelContainer]}>
        {hasScore && (
          <Text style={[styles.scoreLabel, dynamicStyles.labelText, { color }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

function getScoreDecoration(
  scoreToPar: number,
):
  | "double-circle"
  | "single-circle"
  | "double-square"
  | "single-square"
  | null {
  if (scoreToPar <= -3) return "double-circle"; // Albatross
  if (scoreToPar === -2) return "double-circle"; // Eagle
  if (scoreToPar === -1) return "single-circle"; // Birdie
  if (scoreToPar === 0) return null; // Par
  if (scoreToPar === 1) return "single-square"; // Bogey
  if (scoreToPar === 2) return "double-square"; // Double Bogey
  if (scoreToPar >= 3) return "double-square"; // Triple Bogey+
  return null;
}

function getScoreToParInfo(
  scoreToPar: number,
  scoreColors: {
    albatross: string;
    eagle: string;
    birdie: string;
    par: string;
    bogey: string;
    doubleBogey: string;
    tripleBogey: string;
    worse: string;
  },
): {
  label: string;
  color: string;
} {
  if (scoreToPar <= -3)
    return { label: "Albatross", color: scoreColors.albatross };
  if (scoreToPar === -2) return { label: "Eagle", color: scoreColors.eagle };
  if (scoreToPar === -1) return { label: "Birdie", color: scoreColors.birdie };
  if (scoreToPar === 0) return { label: "Par", color: scoreColors.par };
  if (scoreToPar === 1) return { label: "Bogey", color: scoreColors.bogey };
  if (scoreToPar === 2)
    return { label: "Double Bogey", color: scoreColors.doubleBogey };
  if (scoreToPar === 3)
    return { label: "Triple Bogey", color: scoreColors.tripleBogey };
  return { label: `+${scoreToPar}`, color: scoreColors.worse };
}

// Static styles that don't change with size
const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreContentWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumberWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  scoreText: {
    fontWeight: "bold",
  },
  scoreTextUnmodified: {
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  grossText: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  separator: {
    fontWeight: "300",
    color: theme.colors.secondary,
  },
  netText: {
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  labelContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: theme.gap(0.5),
  },
  scoreLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  outerCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerSquare: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerSquare: {
    alignItems: "center",
    justifyContent: "center",
  },
}));
