import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button, Text } from "@/ui";

interface TeeFlipModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The two team IDs in display order [left, right] */
  teamIds: [string, string];
  /** Called when the user dismisses the result with the winning team ID */
  onFlipComplete: (winnerTeamId: string) => void;
  /**
   * If set, the flip always lands on this team (replay mode).
   * Used when tapping the tee icon to replay a previously decided flip.
   * When undefined, winner is chosen randomly.
   */
  predeterminedWinner?: string;
}

/** Total spin duration in ms */
const SPIN_DURATION = 2000;
/** Number of full rotations before landing */
const FULL_ROTATIONS = 4;

/**
 * Golf tee shape drawn with React Native Views, themed for light/dark mode.
 *
 * Anatomy (top to bottom, in default upright orientation):
 * - Cup: wide elliptical top with concave inner
 * - Shaft: tapered body narrowing toward the bottom
 * - Point: triangular pointed tip
 *
 * The tee is drawn upright and the parent rotates it -90° so it points right
 * at 0° rotation and left at 180°.
 */
export function GolfTee({
  color,
  borderColor,
  scale = 1,
}: {
  color: string;
  borderColor: string;
  /** Size multiplier (default 1.0, use ~0.35 for inline icon) */
  scale?: number;
}) {
  return (
    <View style={[teeStyles.container, { transform: [{ scale }] }]}>
      {/* Cup - wide top with rim */}
      <View style={[teeStyles.cupOuter, { borderColor }]}>
        <View style={[teeStyles.cupInner, { backgroundColor: color }]} />
      </View>
      {/* Shaft - tapered body */}
      <View
        style={[teeStyles.shaft, { backgroundColor: color, borderColor }]}
      />
      {/* Point - triangular tip */}
      <View style={[teeStyles.point, { borderTopColor: color }]} />
    </View>
  );
}

const teeStyles = StyleSheet.create((_theme) => ({
  container: {
    alignItems: "center",
  },
  cupOuter: {
    width: 36,
    height: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  cupInner: {
    width: "100%",
    height: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  shaft: {
    width: 12,
    height: 50,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    // Slight taper via border radius at bottom
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  point: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
}));

/**
 * Animated tee flip modal that randomly selects a team.
 *
 * Displays a spinning golf tee that lands pointing at one of two teams.
 * The winner is pre-calculated at mount time and the animation is purely visual.
 * After the animation, the result is shown with an OK button for the user to dismiss.
 *
 * Follows the CustomMultiplierModal pattern for modal structure and styling.
 */
export function TeeFlipModal({
  visible,
  teamIds,
  onFlipComplete,
  predeterminedWinner,
}: TeeFlipModalProps): React.ReactElement | null {
  const { theme } = useUnistyles();
  const rotation = useSharedValue(0);
  const hasStarted = useRef(false);
  const [showResult, setShowResult] = useState(false);

  // Determine winner: use predetermined (replay) or random (first flip)
  const winnerIndex = useMemo(() => {
    if (predeterminedWinner !== undefined) {
      const idx = teamIds.indexOf(predeterminedWinner);
      return idx >= 0 ? idx : 0;
    }
    return Math.random() < 0.5 ? 0 : 1;
  }, [visible, predeterminedWinner, teamIds]);
  const winnerTeamId = teamIds[winnerIndex];

  // Final angle: 0° = pointing right (team 2), 180° = pointing left (team 1)
  const finalAngle = winnerIndex === 0 ? 180 : 0;

  const onAnimationEnd = useCallback(() => {
    setShowResult(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowResult(false);
    onFlipComplete(winnerTeamId);
  }, [onFlipComplete, winnerTeamId]);

  useEffect(() => {
    if (visible && !hasStarted.current) {
      hasStarted.current = true;
      setShowResult(false);

      // Reset
      rotation.value = 0;

      // Target: full rotations + final landing angle
      const targetDeg = FULL_ROTATIONS * 360 + finalAngle;

      // Spin with easeOut for a natural deceleration
      rotation.value = withTiming(
        targetDeg,
        {
          duration: SPIN_DURATION,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          "worklet";
          if (finished) {
            runOnJS(onAnimationEnd)();
          }
        },
      );
    }

    if (!visible) {
      hasStarted.current = false;
      setShowResult(false);
    }
  }, [visible, finalAngle, rotation, onAnimationEnd]);

  const teeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Theme-aware tee colors
  const teeColor = theme.colors.primary;
  const teeBorderColor = theme.colors.secondary;

  // Unmount when not visible to reset all internal state (animation, result)
  // and prevent useEffect oscillation during Jazz progressive loading.
  // Matches the pattern from TeeTimeModal/GameNameModal (commit f781f328).
  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Tee Flip</Text>

          {/* Team labels and tee */}
          <View style={styles.flipContainer}>
            {/* Left team label */}
            <View style={styles.teamLabel}>
              <Text style={[styles.teamText, { color: theme.colors.primary }]}>
                Team {teamIds[0]}
              </Text>
            </View>

            {/* Spinning tee */}
            <Animated.View style={[styles.teeWrapper, teeAnimatedStyle]}>
              {/* Rotate tee -90° so it points right at 0° */}
              <View style={styles.teeRotator}>
                <GolfTee color={teeColor} borderColor={teeBorderColor} />
              </View>
            </Animated.View>

            {/* Right team label */}
            <View style={styles.teamLabel}>
              <Text style={[styles.teamText, { color: theme.colors.primary }]}>
                Team {teamIds[1]}
              </Text>
            </View>
          </View>

          {/* Winner announcement + OK button (always rendered for fixed height) */}
          <View
            style={[styles.resultContainer, { opacity: showResult ? 1 : 0 }]}
            pointerEvents={showResult ? "auto" : "none"}
          >
            <Text style={[styles.resultText, { color: theme.colors.action }]}>
              Team {winnerTeamId} wins the tee flip!
            </Text>
            <View style={styles.okButton}>
              <Button label="OK" onPress={handleDismiss} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(3),
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.gap(3),
  },
  flipContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(2),
    marginBottom: theme.gap(2),
  },
  teamLabel: {
    width: 64,
    alignItems: "center",
  },
  teamText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  teeWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  // Rotate the tee shape -90° so its point faces right at 0° rotation
  teeRotator: {
    transform: [{ rotate: "-90deg" }],
  },
  resultContainer: {
    alignItems: "center",
    gap: theme.gap(2),
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  okButton: {
    minWidth: 120,
  },
}));
