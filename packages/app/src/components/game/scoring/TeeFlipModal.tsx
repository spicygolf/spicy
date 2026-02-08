import { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface TeeFlipModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The two team IDs in display order [left, right] */
  teamIds: [string, string];
  /** Called when the flip animation completes with the winning team ID */
  onFlipComplete: (winnerTeamId: string) => void;
}

/** Total spin duration in ms */
const SPIN_DURATION = 2000;
/** Number of full rotations before landing */
const FULL_ROTATIONS = 4;
/** Delay after landing before calling onFlipComplete (ms) */
const RESULT_DELAY = 1200;

/**
 * Animated tee flip modal that randomly selects a team.
 *
 * Displays a spinning golf tee that lands pointing at one of two teams.
 * The winner is pre-calculated at mount time and the animation is purely visual.
 * Result is announced briefly before dismissing via onFlipComplete.
 *
 * Follows the CustomMultiplierModal pattern for modal structure and styling.
 */
export function TeeFlipModal({
  visible,
  teamIds,
  onFlipComplete,
}: TeeFlipModalProps): React.ReactElement {
  const { theme } = useUnistyles();
  const rotation = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const hasStarted = useRef(false);

  // Pre-calculate winner: 0 = left team (teamIds[0]), 1 = right team (teamIds[1])
  const winnerIndex = useMemo(
    () => (Math.random() < 0.5 ? 0 : 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );
  const winnerTeamId = teamIds[winnerIndex];

  // Final angle: 0° = pointing right (team 2), 180° = pointing left (team 1)
  const finalAngle = winnerIndex === 0 ? 180 : 0;

  const handleAnimationDone = useCallback(() => {
    onFlipComplete(winnerTeamId);
  }, [onFlipComplete, winnerTeamId]);

  useEffect(() => {
    if (visible && !hasStarted.current) {
      hasStarted.current = true;

      // Reset
      rotation.value = 0;
      resultOpacity.value = 0;

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
            // Show result text, then dismiss
            resultOpacity.value = withSequence(
              withTiming(1, { duration: 200 }),
              withDelay(
                RESULT_DELAY,
                withTiming(1, { duration: 0 }, (done) => {
                  "worklet";
                  if (done) {
                    runOnJS(handleAnimationDone)();
                  }
                }),
              ),
            );
          }
        },
      );
    }

    if (!visible) {
      hasStarted.current = false;
    }
  }, [visible, finalAngle, rotation, resultOpacity, handleAnimationDone]);

  const teeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

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
            <Animated.View style={[styles.teeWrapper, teeStyle]}>
              <View style={styles.teeShape}>
                <View
                  style={[
                    styles.teeHead,
                    { backgroundColor: theme.colors.action },
                  ]}
                />
                <View
                  style={[
                    styles.teePoint,
                    { borderTopColor: theme.colors.action },
                  ]}
                />
              </View>
            </Animated.View>

            {/* Right team label */}
            <View style={styles.teamLabel}>
              <Text style={[styles.teamText, { color: theme.colors.primary }]}>
                Team {teamIds[1]}
              </Text>
            </View>
          </View>

          {/* Winner announcement */}
          <Animated.View style={[styles.resultContainer, resultStyle]}>
            <Text style={[styles.resultText, { color: theme.colors.action }]}>
              Team {winnerTeamId} wins the tee!
            </Text>
          </Animated.View>
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
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  // CSS-drawn golf tee: a rectangle (head) with a triangle (point) below it,
  // rotated so the tee points right at 0° and left at 180°.
  // The whole shape is rotated -90° by default so the triangle points right.
  teeShape: {
    alignItems: "center",
    transform: [{ rotate: "-90deg" }],
  },
  teeHead: {
    width: 40,
    height: 10,
    borderRadius: 3,
  },
  teePoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 40,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  resultContainer: {
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
}));
