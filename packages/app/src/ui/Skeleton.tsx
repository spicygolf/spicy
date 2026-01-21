import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}

/**
 * Animated skeleton/shimmer placeholder for loading states.
 * Pulses opacity to indicate loading.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
    />
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
}

/**
 * Groups multiple skeletons together.
 */
export function SkeletonGroup({ children }: SkeletonGroupProps) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  skeleton: {
    backgroundColor: theme.colors.border,
  },
  group: {
    gap: 6,
  },
}));
