import { Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/ui";

interface HoleChooserProps {
  /** Total number of holes in the game (typically 9 or 18) */
  totalHoles: number;
  /** Hole numbers currently selected for this value group */
  selectedHoles: string[];
  /** Called when user taps a hole button */
  onHoleToggle: (holeNumber: string) => void;
}

/**
 * Grid of hole buttons for per-hole option customization.
 *
 * Displays holes in rows of 9 (matching v0.3 layout). Selected holes
 * are filled with the action color; unselected holes are outlined.
 */
export function HoleChooser({
  totalHoles,
  selectedHoles,
  onHoleToggle,
}: HoleChooserProps) {
  const { theme } = useUnistyles();

  const rowCount = Math.ceil(totalHoles / 9);
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {rows.map((row) => {
        const start = row * 9;
        const end = Math.min(start + 9, totalHoles);
        const holes = Array.from({ length: end - start }, (_, i) =>
          String(start + i + 1),
        );

        return (
          <View key={row} style={styles.row}>
            {holes.map((holeNum) => {
              const isSelected = selectedHoles.includes(holeNum);
              return (
                <Pressable
                  key={holeNum}
                  style={[
                    styles.holeButton,
                    isSelected
                      ? {
                          backgroundColor: theme.colors.action,
                          borderColor: theme.colors.action,
                        }
                      : {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                  ]}
                  onPress={() => onHoleToggle(holeNum)}
                  accessibilityLabel={`Hole ${holeNum}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.holeText,
                      {
                        color: isSelected ? "#FFFFFF" : theme.colors.primary,
                      },
                    ]}
                  >
                    {holeNum}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(0.5),
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(0.5),
  },
  holeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.gap(0.75),
    borderRadius: 6,
    borderWidth: 1.5,
    minHeight: 36,
  },
  holeText: {
    fontSize: 13,
    fontWeight: "600",
  },
}));
