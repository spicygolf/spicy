import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ModalHeader, Text } from "@/ui";
import { GolfTee } from "./TeeFlipModal";

/** A per-hole option override summary for display */
export interface HoleOptionOverride {
  label: string;
  value: string;
}

interface HoleToolbarProps {
  onChangeTeams?: () => void;
  /** Overall multiplier for the hole (1x, 2x, 4x, 8x, etc.) */
  overallMultiplier?: number;
  /** Whether a custom multiplier is active (shows "custom" label) */
  isCustomMultiplier?: boolean;
  /** Handler for tapping the multiplier badge to open custom multiplier modal */
  onMultiplierPress?: () => void;
  /** Whether the tee flip was declined on this hole */
  teeFlipDeclined?: boolean;
  /** Called when the declined tee icon is tapped to undo the decline */
  onTeeFlipUndoDecline?: () => void;
  /** Per-hole option overrides active on this hole */
  optionOverrides?: HoleOptionOverride[];
  /** Hole number for the modal title */
  holeNumber?: string;
  /** Whether explain mode is enabled (for future use) */
  explainMode?: boolean;
  onToggleExplain?: () => void;
}

export function HoleToolbar({
  onChangeTeams,
  overallMultiplier = 1,
  isCustomMultiplier = false,
  onMultiplierPress,
  teeFlipDeclined = false,
  onTeeFlipUndoDecline,
  optionOverrides,
  holeNumber,
  explainMode = false,
  onToggleExplain,
}: HoleToolbarProps): React.ReactElement {
  const { theme } = useUnistyles();
  const [showOverridesModal, setShowOverridesModal] = useState(false);
  const hasOverrides = optionOverrides && optionOverrides.length > 0;

  // Format multiplier display (1x, 2x, 4x, 8x)
  const multiplierText = `${overallMultiplier}x`;
  const isActive = overallMultiplier > 1;

  // Badge is tappable if handler provided
  const isTappable = !!onMultiplierPress;

  const multiplierBadge = (
    <View
      style={[
        styles.multiplierBadge,
        isCustomMultiplier && styles.multiplierBadgeCustom,
      ]}
    >
      <Text style={[styles.multiplierText, { color: theme.colors.multiplier }]}>
        {multiplierText}
      </Text>
      {isCustomMultiplier && (
        <Text style={[styles.customLabel, { color: theme.colors.multiplier }]}>
          custom
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Left: Team chooser icon + declined tee flip indicator */}
      <View style={styles.leftSection}>
        {onChangeTeams && (
          <Pressable
            style={styles.iconButton}
            onPress={onChangeTeams}
            hitSlop={12}
            accessibilityLabel="Change teams"
          >
            <FontAwesome6
              name="people-group"
              iconStyle="solid"
              size={24}
              color={theme.colors.action}
            />
          </Pressable>
        )}
        {teeFlipDeclined && (
          <Pressable
            onPress={onTeeFlipUndoDecline}
            hitSlop={12}
            style={styles.teeFlipDeclined}
            accessibilityLabel="Undo declined tee flip"
          >
            <GolfTee
              color={theme.colors.secondary}
              borderColor={theme.colors.secondary}
              scale={0.35}
            />
          </Pressable>
        )}
      </View>

      {/* Center: Overall multiplier display (tappable for custom multiplier) */}
      <View style={styles.centerSection}>
        {isActive ? (
          isTappable ? (
            <Pressable
              onPress={onMultiplierPress}
              hitSlop={8}
              accessibilityLabel={
                isCustomMultiplier
                  ? "Edit custom multiplier"
                  : "Set custom multiplier"
              }
            >
              {multiplierBadge}
            </Pressable>
          ) : (
            multiplierBadge
          )
        ) : isTappable ? (
          <Pressable
            onPress={onMultiplierPress}
            hitSlop={8}
            style={styles.multiplierBadgePlaceholder}
            accessibilityLabel="Set custom multiplier"
          >
            <Text
              style={[
                styles.placeholderText,
                { color: theme.colors.secondary },
              ]}
            >
              1x
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Right: Option overrides + explain mode */}
      <View style={styles.rightSection}>
        {hasOverrides && (
          <Pressable
            style={styles.iconButton}
            onPress={() => setShowOverridesModal(true)}
            hitSlop={12}
            accessibilityLabel="View hole option overrides"
          >
            <FontAwesome6
              name="sliders"
              iconStyle="solid"
              size={20}
              color={theme.colors.action}
            />
          </Pressable>
        )}
        <Pressable
          style={[
            styles.iconButton,
            (!onToggleExplain || !explainMode) && styles.iconButtonInactive,
          ]}
          onPress={onToggleExplain}
          disabled={!onToggleExplain}
          hitSlop={12}
          accessibilityLabel="Explain mode (coming soon)"
        >
          <FontAwesome6
            name="circle-question"
            iconStyle="solid"
            size={24}
            color={explainMode ? theme.colors.action : theme.colors.border}
          />
        </Pressable>
      </View>

      {hasOverrides && (
        <Modal
          visible={showOverridesModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOverridesModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowOverridesModal(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <ModalHeader
                title={`Hole ${holeNumber ?? ""} Overrides`}
                onClose={() => setShowOverridesModal(false)}
              />
              <View style={styles.overridesList}>
                {optionOverrides!.map((override) => (
                  <View key={override.label} style={styles.overrideRow}>
                    <Text style={styles.overrideLabel}>{override.label}</Text>
                    <Text style={styles.overrideValue}>{override.value}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(0.5),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.gap(0.25),
  },
  iconButton: {
    padding: theme.gap(0.5),
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonInactive: {
    opacity: 0.3,
  },
  multiplierBadge: {
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(0.5),
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  multiplierBadgeCustom: {
    paddingVertical: theme.gap(0.25),
  },
  multiplierBadgePlaceholder: {
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(0.5),
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    opacity: 0.35,
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  customLabel: {
    fontSize: 7,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: -2,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  teeFlipDeclined: {
    width: 20,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 400,
  },
  overridesList: {
    gap: theme.gap(1),
  },
  overrideRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(0.5),
  },
  overrideLabel: {
    fontSize: 14,
    color: theme.colors.primary,
    flex: 1,
  },
  overrideValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.action,
  },
}));
