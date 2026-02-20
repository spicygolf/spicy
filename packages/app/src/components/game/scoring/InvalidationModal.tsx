import { Modal, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { InvalidatedItem, InvalidationResult } from "spicylib/scoring";
import { Button, Text } from "@/ui";

interface InvalidationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The invalidation result to display (null when hidden) */
  result: InvalidationResult | null;
  /** Whether an undo snapshot is available (score change only) */
  canUndo: boolean;
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
 * Lists each affected item with a reason, then shows Keep/Remove actions
 * and an optional Undo Edit button.
 *
 * Follows the TeeFlipConfirmModal unmount pattern (returns null when not visible)
 * to avoid Jazz progressive loading oscillation.
 */
export function InvalidationModal({
  visible,
  result,
  canUndo,
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

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>This change affects later holes</Text>

          <ScrollView style={styles.scrollArea}>
            {holeNums.map((holeNum) => (
              <View key={holeNum} style={styles.holeGroup}>
                <Text style={styles.holeLabel}>Hole {holeNum}</Text>
                {groupedItems[holeNum]?.map((item, idx) => (
                  <View key={`${holeNum}-${idx}`} style={styles.itemRow}>
                    <Text style={styles.itemName}>{formatItemName(item)}</Text>
                    <Text style={styles.itemReason}>{item.reason}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <Text style={styles.question}>
            Remove the affected {describeItemKinds(result.items)}, or keep{" "}
            {result.items.length === 1 ? "it" : "them"}?
          </Text>

          <View style={styles.keepRemoveRow}>
            <View style={styles.actionButton}>
              <Button label="Keep" variant="secondary" onPress={onKeep} />
            </View>
            <View style={styles.actionButton}>
              <Button label="Remove" onPress={onRemove} />
            </View>
          </View>

          {canUndo && (
            <View style={styles.undoRow}>
              <Button
                label="Undo Edit"
                variant="secondary"
                onPress={onUndoEdit}
              />
            </View>
          )}
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
 * Format the name/label for an invalidated item.
 */
function formatItemName(item: InvalidatedItem): string {
  switch (item.kind) {
    case "multiplier":
      return `${item.disp} (Team ${item.teamId})`;
    case "tee_flip":
      return "Tee flip";
    default:
      return "Unknown";
  }
}

/**
 * Describe the kinds of items present (e.g., "multipliers", "tee flips",
 * "multipliers and tee flips") for the question prompt.
 */
function describeItemKinds(items: InvalidatedItem[]): string {
  const hasMultiplier = items.some((i) => i.kind === "multiplier");
  const hasTeeFlip = items.some((i) => i.kind === "tee_flip");
  if (hasMultiplier && hasTeeFlip) return "multipliers and tee flips";
  if (hasTeeFlip) return items.length === 1 ? "tee flip" : "tee flips";
  return items.length === 1 ? "multiplier" : "multipliers";
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
    fontSize: 17,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  scrollArea: {
    maxHeight: 250,
    marginBottom: theme.gap(2),
  },
  holeGroup: {
    marginBottom: theme.gap(1.5),
    alignItems: "center",
  },
  holeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: theme.gap(0.5),
  },
  itemRow: {
    marginBottom: theme.gap(0.75),
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  itemReason: {
    fontSize: 13,
    color: theme.colors.secondary,
    textAlign: "center",
    marginTop: 2,
  },
  question: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  keepRemoveRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  actionButton: {
    flex: 1,
  },
  undoRow: {
    marginTop: theme.gap(1),
  },
}));
