import { UnistylesRuntime } from "react-native-unistyles";

/**
 * UI Scale sizes matching ScoreInput size prop
 * These map to scale factors: sm=0.6, md=0.75, lg=1.0, xl=1.25
 */
export type UIScaleSize = "sm" | "md" | "lg" | "xl";

/**
 * Scale factors for each size
 * lg (1.0) is the baseline - all BASE dimensions are calibrated for this
 */
export const UI_SCALE_FACTORS: Record<UIScaleSize, number> = {
  sm: 0.6,
  md: 0.75,
  lg: 1.0,
  xl: 1.25,
};

/**
 * Maps device font scale to UIScaleSize
 * Device font scale typically ranges from 0.8 to 2.0+
 */
function fontScaleToSize(fontScale: number): UIScaleSize {
  if (fontScale < 0.9) return "sm";
  if (fontScale < 1.1) return "md";
  if (fontScale < 1.3) return "lg";
  return "xl";
}

export interface UIScaleResult {
  /** Size name for components (sm, md, lg, xl) */
  size: UIScaleSize;
  /** Raw scale factor (0.6, 0.75, 1.0, 1.25) */
  scale: number;
  /** Device font scale from system settings */
  deviceFontScale: number;
  /** Scale a base dimension value */
  scaled: (base: number) => number;
}

/**
 * Hook to get UI scale based on device font scale settings.
 *
 * Uses UnistylesRuntime.fontScale which reflects:
 * - iOS: Settings > Display & Brightness > Text Size
 * - Android: Settings > Display > Font size
 *
 * Returns both the discrete size (sm/md/lg/xl) for component props
 * and the numeric scale factor for custom calculations.
 *
 * @example
 * ```tsx
 * const { size, scale, scaled } = useUIScale();
 *
 * // Use size for component props
 * <ScoreInput size={size} />
 *
 * // Use scale for custom dimensions
 * const columnWidth = scaled(110); // 110 * scale
 * ```
 */
export function useUIScale(): UIScaleResult {
  // Get device font scale from Unistyles Runtime
  // This auto-updates when system settings change
  const deviceFontScale = UnistylesRuntime.fontScale;

  // Map to our discrete sizes
  const size = fontScaleToSize(deviceFontScale);
  const scale = UI_SCALE_FACTORS[size];

  return {
    size,
    scale,
    deviceFontScale,
    scaled: (base: number) => Math.round(base * scale),
  };
}
