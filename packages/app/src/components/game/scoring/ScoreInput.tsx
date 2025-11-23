import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface ScoreInputProps {
  gross: number | null;
  net: number | null;
  par: number;
  netPar: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onScoreTap?: () => void;
  readonly?: boolean;
}

export function ScoreInput({
  gross,
  net,
  par,
  netPar,
  onIncrement,
  onDecrement,
  onScoreTap,
  readonly = false,
}: ScoreInputProps) {
  const { theme } = useUnistyles();

  // Determine if score has been modified
  const hasScore = gross !== null;
  const isUnmodified = !hasScore;

  // Calculate score-to-par and get display info
  const scoreToPar = gross !== null ? gross - par : 0;
  const { label, color } = getScoreToParInfo(scoreToPar);

  // Display values - show par/netPar if no score, otherwise actual values
  const displayGross = hasScore ? gross : par;
  const displayNet = hasScore ? (net ?? netPar) : netPar;
  const showNet = displayNet !== displayGross;

  const handleDecrement = (): void => {
    console.log("[ScoreInput] Decrement pressed", { gross, par });
    onDecrement();
  };

  const handleIncrement = (): void => {
    console.log("[ScoreInput] Increment pressed", { gross, par });
    onIncrement();
  };

  const handleScoreTap = (): void => {
    console.log("[ScoreInput] Score tapped", { gross, par });
    if (onScoreTap) {
      onScoreTap();
    } else {
      // Default behavior: act like increment button
      handleIncrement();
    }
  };

  // Determine decoration type based on score-to-par
  const decoration = getScoreDecoration(scoreToPar);

  return (
    <View>
      <View style={styles.container}>
        {/* Decrement Button */}
        <TouchableOpacity
          style={[styles.button, readonly && styles.buttonDisabled]}
          onPress={handleDecrement}
          disabled={readonly || (gross !== null && gross <= 1)}
          accessibilityLabel="Decrease score"
        >
          <FontAwesome6
            name="minus"
            iconStyle="solid"
            size={16}
            color={
              readonly || (gross !== null && gross <= 1)
                ? theme.colors.border
                : theme.colors.action
            }
          />
        </TouchableOpacity>

        {/* Score Display - Tappable */}
        <TouchableOpacity
          style={styles.scoreContainer}
          onPress={handleScoreTap}
          disabled={readonly}
          activeOpacity={0.6}
          accessibilityLabel={`Score: ${displayGross}${showNet ? ` net ${displayNet}` : ""}`}
        >
          {/* Fixed height container to prevent vertical shifting */}
          <View style={styles.scoreContentWrapper}>
            {/* Score number wrapper with decorations - always present */}
            <View style={styles.scoreNumberWrapper}>
              {/* Always render circle structure for par/birdie/eagle/albatross */}
              {(decoration === "double-circle" ||
                decoration === "single-circle" ||
                decoration === null) && (
                <View
                  style={[
                    styles.outerCircle,
                    {
                      borderColor:
                        decoration === "double-circle" ? color : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        borderColor:
                          decoration === "single-circle" ||
                          decoration === "double-circle"
                            ? color
                            : "transparent",
                      },
                    ]}
                  >
                    {renderScoreNumber(
                      displayGross,
                      displayNet,
                      showNet,
                      isUnmodified,
                    )}
                  </View>
                </View>
              )}
              {/* Always render square structure for bogeys */}
              {(decoration === "double-square" ||
                decoration === "single-square") && (
                <View
                  style={[
                    styles.outerSquare,
                    {
                      borderColor:
                        decoration === "double-square" ? color : "transparent",
                    },
                  ]}
                >
                  <View style={[styles.innerSquare, { borderColor: color }]}>
                    {renderScoreNumber(
                      displayGross,
                      displayNet,
                      showNet,
                      isUnmodified,
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Increment Button */}
        <TouchableOpacity
          style={[styles.button, readonly && styles.buttonDisabled]}
          onPress={handleIncrement}
          disabled={readonly || (gross !== null && gross >= 12)}
          accessibilityLabel="Increase score"
        >
          <FontAwesome6
            name="plus"
            iconStyle="solid"
            size={16}
            color={
              readonly || (gross !== null && gross >= 12)
                ? theme.colors.border
                : theme.colors.action
            }
          />
        </TouchableOpacity>
      </View>
      <View style={styles.labelContainer}>
        {hasScore && (
          <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
        )}
      </View>
    </View>
  );
}

function renderScoreNumber(
  displayGross: number,
  displayNet: number,
  showNet: boolean,
  isUnmodified: boolean,
): React.ReactElement {
  if (showNet) {
    return (
      <View style={styles.scoreRow}>
        <Text
          style={[styles.grossText, isUnmodified && styles.scoreTextUnmodified]}
        >
          {displayGross}
        </Text>
        <Text
          style={[styles.separator, isUnmodified && styles.scoreTextUnmodified]}
        >
          /
        </Text>
        <Text
          style={[styles.netText, isUnmodified && styles.scoreTextUnmodified]}
        >
          {displayNet}
        </Text>
      </View>
    );
  }

  return (
    <Text
      style={[styles.scoreText, isUnmodified && styles.scoreTextUnmodified]}
    >
      {displayGross}
    </Text>
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

function getScoreToParInfo(scoreToPar: number): {
  label: string;
  color: string;
} {
  if (scoreToPar <= -3) return { label: "Albatross", color: "#FFD700" }; // Gold
  if (scoreToPar === -2) return { label: "Eagle", color: "#FF6B35" }; // Orange
  if (scoreToPar === -1) return { label: "Birdie", color: "#4ECDC4" }; // Teal
  if (scoreToPar === 0) return { label: "Par", color: "#95A5A6" }; // Gray
  if (scoreToPar === 1) return { label: "Bogey", color: "#E74C3C" }; // Red
  if (scoreToPar === 2) return { label: "Double Bogey", color: "#C0392B" }; // Dark Red
  if (scoreToPar === 3) return { label: "Triple Bogey", color: "#8E44AD" }; // Purple
  return { label: `+${scoreToPar}`, color: "#34495E" }; // Dark Gray
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // gap: theme.gap(2),
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
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
    minWidth: 80,
  },
  // Fixed height wrapper to prevent vertical shifting
  scoreContentWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56, // 32px score + 18px label + 6px spacing
  },
  // Wrapper for score number that aligns with button centers (36px)
  scoreNumberWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  scoreTextUnmodified: {
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  grossText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  separator: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.secondary,
    marginHorizontal: theme.gap(0.5),
  },
  netText: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  // Fixed container for label to prevent layout shift
  labelContainer: {
    height: 18,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: theme.gap(0.5),
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Double circle (eagle, albatross, and birdie with transparent outer)
  outerCircle: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  // Double square (double bogey, triple bogey+, and bogey with transparent outer)
  outerSquare: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  innerSquare: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
}));
