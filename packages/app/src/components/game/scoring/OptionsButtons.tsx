import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useUIScale } from "@/hooks";
import { Text } from "@/ui";

/**
 * Map legacy/custom icon names to FontAwesome6 icons.
 * Icons not in the map are passed through - they may be valid FA6 names
 * stored in the database.
 */
function mapIconName(icon: string): string {
  const iconMap: Record<string, string> = {
    album: "bullseye", // prox (closest to pin)
    // Add more mappings as needed
  };
  return iconMap[icon] ?? icon;
}

export interface OptionButton {
  name: string;
  displayName: string;
  icon?: string;
  type: "junk" | "multiplier";
  selected: boolean;
  /**
   * Points value for this option (shown on badges when awarded/selected)
   */
  points?: number;
  /**
   * If true, this option was activated on a previous hole and is still in effect.
   * Inherited options are shown as selected but dimmed and disabled.
   */
  inherited?: boolean;
  /**
   * If true, this is a calculated/automatic junk (e.g., birdie, eagle, low_ball).
   * Calculated junk is shown as selected but cannot be toggled by the user.
   * based_on: "gross", "net", or "logic" (not "user")
   */
  calculated?: boolean;
  /**
   * If true, this is an earned/automatic multiplier (e.g., birdie_bbq).
   * Earned multipliers are displayed as badges and cannot be toggled.
   */
  earned?: boolean;
}

interface OptionsButtonsProps {
  options: OptionButton[];
  onOptionPress: (optionName: string) => void;
  readonly?: boolean;
  /** If true, display buttons in a vertical column instead of horizontal row */
  vertical?: boolean;
  /** If true, align buttons to the right (justify-content: flex-end) */
  alignRight?: boolean;
}

// Base dimensions at scale 1.0 (lg)
const BASE = {
  // Button (user-toggleable)
  buttonPaddingH: 12,
  buttonPaddingV: 8,
  buttonMinHeight: 32,
  buttonFontSize: 13,
  buttonIconSize: 16,
  buttonBorderRadius: 6,
  // Badge (calculated/awarded) - slightly smaller, pill shape
  badgePaddingH: 10,
  badgePaddingV: 5,
  badgeMinHeight: 26,
  badgeFontSize: 12,
  badgeIconSize: 13,
  badgeBorderRadius: 14, // more rounded pill shape
  // Points circle (unread count style)
  pointsCircleSize: 18,
  pointsFontSize: 10,
};

export function OptionsButtons({
  options,
  onOptionPress,
  readonly = false,
  vertical = false,
  alignRight = false,
}: OptionsButtonsProps) {
  const { theme } = useUnistyles();
  const { scale } = useUIScale();

  if (options.length === 0) {
    return null;
  }

  // Scale dimensions
  const dim = {
    buttonPaddingH: Math.round(BASE.buttonPaddingH * scale),
    buttonPaddingV: Math.round(BASE.buttonPaddingV * scale),
    buttonMinHeight: Math.round(BASE.buttonMinHeight * scale),
    buttonFontSize: Math.round(BASE.buttonFontSize * scale),
    buttonIconSize: Math.round(BASE.buttonIconSize * scale),
    buttonBorderRadius: Math.round(BASE.buttonBorderRadius * scale),
    badgePaddingH: Math.round(BASE.badgePaddingH * scale),
    badgePaddingV: Math.round(BASE.badgePaddingV * scale),
    badgeMinHeight: Math.round(BASE.badgeMinHeight * scale),
    badgeFontSize: Math.round(BASE.badgeFontSize * scale),
    badgeIconSize: Math.round(BASE.badgeIconSize * scale),
    badgeBorderRadius: Math.round(BASE.badgeBorderRadius * scale),
    pointsCircleSize: Math.round(BASE.pointsCircleSize * scale),
    pointsFontSize: Math.round(BASE.pointsFontSize * scale),
  };

  return (
    <View
      style={[
        styles.container,
        vertical && styles.containerVertical,
        alignRight && styles.containerAlignRight,
      ]}
    >
      {options.map((option) => {
        const isMultiplier = option.type === "multiplier";
        const isSelected = option.selected;
        const isInherited = option.inherited ?? false;
        const isCalculated = option.calculated ?? false;
        const isEarned = option.earned ?? false;

        // Calculated junk and earned multipliers render as badges (smaller, pill shape)
        const isBadge = isCalculated || isEarned;

        // Colors based on type and state
        // Badges: filled blue (junk) or orange (earned multiplier)
        // Buttons: blue outline/filled for junk, red for multipliers
        let buttonColor: string;
        let textColor: string;
        let borderColor: string;

        const junkColor = theme.colors.junk;
        const multiplierColor = theme.colors.multiplier;

        if (isEarned) {
          // Earned multiplier badge - filled red (same as user multipliers when active)
          buttonColor = multiplierColor;
          textColor = theme.colors.white;
          borderColor = multiplierColor;
        } else if (isBadge) {
          // Calculated junk badge - filled blue
          buttonColor = junkColor;
          textColor = theme.colors.white;
          borderColor = junkColor;
        } else if (isMultiplier) {
          // User multiplier button
          buttonColor = isSelected ? multiplierColor : theme.colors.background;
          textColor = isSelected ? theme.colors.white : multiplierColor;
          borderColor = multiplierColor;
        } else {
          // User-toggleable junk button
          buttonColor = isSelected ? junkColor : theme.colors.background;
          textColor = isSelected ? theme.colors.white : junkColor;
          borderColor = junkColor;
        }

        // Calculated junk, earned multipliers, and inherited options can't be toggled
        const isDisabled = readonly || isInherited || isCalculated || isEarned;
        // Only dim inherited options (from previous hole), not calculated junk or earned multipliers
        const shouldDim = isInherited;

        // Show points on badges (always) and on buttons when selected
        const showPoints =
          option.points !== undefined && (isBadge || isSelected);

        // Dynamic styles based on button vs badge
        const dynamicStyles = isBadge
          ? {
              paddingHorizontal: dim.badgePaddingH,
              paddingVertical: dim.badgePaddingV,
              minHeight: dim.badgeMinHeight,
              borderRadius: dim.badgeBorderRadius,
            }
          : {
              paddingHorizontal: dim.buttonPaddingH,
              paddingVertical: dim.buttonPaddingV,
              minHeight: dim.buttonMinHeight,
              borderRadius: dim.buttonBorderRadius,
            };

        const fontSize = isBadge ? dim.badgeFontSize : dim.buttonFontSize;
        const iconSize = isBadge ? dim.badgeIconSize : dim.buttonIconSize;

        return (
          <TouchableOpacity
            key={option.name}
            style={[
              styles.optionButton,
              dynamicStyles,
              { backgroundColor: buttonColor, borderColor: borderColor },
              shouldDim && styles.optionButtonDisabled,
            ]}
            onPress={() => onOptionPress(option.name)}
            disabled={isDisabled}
            accessibilityLabel={[
              option.displayName,
              showPoints &&
                option.points !== undefined &&
                `${option.points > 0 ? "+" : ""}${option.points}`,
              isSelected && "selected",
              isCalculated && "automatic",
              isInherited && "from previous hole",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {option.icon && (
              <FontAwesome6
                name={mapIconName(option.icon) as "bullseye"}
                iconStyle="solid"
                size={iconSize}
                color={textColor}
                style={styles.optionIcon}
              />
            )}
            <Text style={[styles.optionText, { color: textColor, fontSize }]}>
              {option.displayName}
            </Text>
            {showPoints && option.points !== undefined && (
              <View
                style={[
                  styles.pointsCircle,
                  {
                    width: dim.pointsCircleSize,
                    height: dim.pointsCircleSize,
                    borderRadius: dim.pointsCircleSize / 2,
                    backgroundColor: theme.colors.white,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pointsText,
                    {
                      fontSize: dim.pointsFontSize,
                      color: borderColor,
                    },
                  ]}
                >
                  {option.points}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: theme.gap(0.5),
  },
  containerVertical: {
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-end",
  },
  containerAlignRight: {
    justifyContent: "flex-end",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: theme.gap(0.5),
  },
  optionText: {
    fontWeight: "500",
  },
  pointsCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.gap(0.5),
  },
  pointsText: {
    fontWeight: "700",
  },
}));
