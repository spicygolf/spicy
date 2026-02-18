import { Modal, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { InvalidatedItem, InvalidationResult } from "spicylib/scoring";
import { Button, Text } from "@/ui";

interface InvalidationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The invalidation result to display (null when hidden) */
  result: InvalidationResult | null;
  /** Called when user taps "Remove" -- remove invalid items */
  onRemove: () => void;
  /** Called when user taps "Keep" -- dismiss without changes */
  onKeep: () => void;
  /** Called when user taps "Undo Edit" -- revert the score change */
  onUndoEdit: () => void;
}

/**
 * Modal showing invalidated multipliers and tee flips after a score edit.
 *
 * Groups items by hole number and shows score impact per team.
 * Three buttons: Remove, Keep, Undo Edit.
 *
 * Follows the TeeFlipConfirmModal unmount pattern (returns null when not visible)
 * to avoid Jazz progressive loading oscillation.
 */
export function InvalidationModal({
  visible,
  result,
  onRemove,
  onKeep,
  onUndoEdit,
}: InvalidationModalProps): React.ReactElement | null {
  if (!visible || !result) {
    return null;
  }

  // Group items by hole number
  const groupedItems = groupByHole(result.items);
  const holeNums = Object.keys(groupedItems).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );

  // Build score impact text
  const impactText = result.scoreImpact
    .filter((si) => si.currentTotal !== si.projectedTotal)
    .map(
      (si) =>
        `Team ${si.teamId}: ${si.currentTotal} → ${si.projectedTotal} pts`,
    )
    .join(", ");

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Score Edit Affects Later Holes</Text>

          <ScrollView style={styles.scrollArea}>
            {holeNums.map((holeNum) => (
              <View key={holeNum} style={styles.holeGroup}>
                <Text style={styles.holeLabel}>Hole {holeNum}</Text>
                {groupedItems[holeNum]?.map((item, idx) => (
                  <Text key={`${holeNum}-${idx}`} style={styles.itemText}>
                    {formatItem(item)}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>

          {impactText.length > 0 && (
            <Text style={styles.impactText}>Score impact: {impactText}</Text>
          )}

          <View style={styles.buttons}>
            <View style={styles.button}>
              <Button
                label="Undo Edit"
                variant="secondary"
                onPress={onUndoEdit}
              />
            </View>
            <View style={styles.button}>
              <Button label="Keep" variant="secondary" onPress={onKeep} />
            </View>
            <View style={styles.button}>
              <Button label="Remove" onPress={onRemove} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Group invalidated items by hole number.
 */
function groupByHole(
  items: InvalidatedItem[],
): Record<string, InvalidatedItem[]> {
  const groups: Record<string, InvalidatedItem[]> = {};
  for (const item of items) {
    if (!groups[item.holeNum]) {
      groups[item.holeNum] = [];
    }
    groups[item.holeNum].push(item);
  }
  return groups;
}

/**
 * Format a single invalidated item for display.
 */
function formatItem(item: InvalidatedItem): string {
  switch (item.kind) {
    case "multiplier":
      return `Team ${item.teamId}'s ${item.disp}: ${item.reason}`;
    case "tee_flip":
      return `Tee flip result: ${item.reason}`;
    default:
      return "Unknown invalidation";
  }
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
    maxWidth: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  scrollArea: {
    maxHeight: 300,
    marginBottom: theme.gap(2),
  },
  holeGroup: {
    marginBottom: theme.gap(1.5),
  },
  holeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: theme.gap(0.5),
  },
  itemText: {
    fontSize: 14,
    color: theme.colors.secondary,
    paddingLeft: theme.gap(1),
    marginBottom: theme.gap(0.25),
  },
  impactText: {
    fontSize: 13,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: theme.gap(2),
    fontStyle: "italic",
  },
  buttons: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  button: {
    flex: 1,
  },
}));
