import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { Back } from "@/components/Back";
import { useGame, useSaveOptionToHole } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Input, Screen, Text } from "@/ui";
import { HoleChooser } from "./HoleChooser";
import { OptionSectionHeader } from "./OptionSectionHeader";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "HoleOverrides"
>;

/**
 * Per-hole option customization screen.
 *
 * Shows the option's possible values with a HoleChooser grid for each value.
 * Tapping a hole in a value section assigns that value to that hole.
 * For binary options (bool), tapping moves the hole between the two sections.
 */
export function HoleOverrides({ route }: Props) {
  const { optionName } = route.params;

  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      holes: { $each: { options: true } },
    },
  });

  const { setHoleOption } = useSaveOptionToHole(game);

  // Get the game-level option definition
  const specOption = useMemo((): GameOption | null => {
    if (!game?.$isLoaded || !game.spec?.$isLoaded) return null;
    const opt = game.spec[optionName];
    if (!opt || opt.type !== "game") return null;
    return opt as GameOption;
  }, [game, optionName]);

  const gameDefault = specOption?.value ?? specOption?.defaultValue;
  const totalHoles =
    game?.$isLoaded && game.holes?.$isLoaded ? game.holes.length : 18;

  // Build a map of holeNumber -> effective value for this option
  const holeValueMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!game?.$isLoaded || !game.holes?.$isLoaded || !gameDefault) return map;

    for (const hole of game.holes) {
      if (!hole?.$isLoaded) continue;
      const holeNum = hole.hole;
      let value = gameDefault;

      if (hole.$jazz.has("options") && hole.options?.$isLoaded) {
        const override = hole.options[optionName];
        if (override && override.type === "game") {
          const overrideVal =
            (override as GameOption).value ??
            (override as GameOption).defaultValue;
          if (overrideVal !== undefined) {
            value = overrideVal;
          }
        }
      }

      map[holeNum] = value;
    }

    return map;
  }, [game, optionName, gameDefault]);

  // Get the distinct values currently in use (default + any overrides)
  const distinctValues = useMemo(() => {
    if (!specOption || !gameDefault) return [];

    const values = new Set<string>();
    values.add(gameDefault);

    // For bool options, always show both values
    if (specOption.valueType === "bool") {
      values.add("true");
      values.add("false");
    }

    // Add any override values
    for (const val of Object.values(holeValueMap)) {
      values.add(val);
    }

    // Sort: default first, then others
    const sorted = Array.from(values);
    sorted.sort((a, b) => {
      if (a === gameDefault) return -1;
      if (b === gameDefault) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [specOption, gameDefault, holeValueMap]);

  // Get holes for a given value
  const getHolesForValue = useCallback(
    (value: string): string[] => {
      return Object.entries(holeValueMap)
        .filter(([_, v]) => v === value)
        .map(([h]) => h);
    },
    [holeValueMap],
  );

  // Handle hole toggle: assign this hole to the tapped value section
  const handleHoleToggle = useCallback(
    (value: string, holeNumber: string) => {
      if (!specOption || !gameDefault) return;

      const currentValue = holeValueMap[holeNumber];

      if (currentValue === value) {
        // Already set to this value — for binary options, toggle to other value
        if (specOption.valueType === "bool") {
          const otherValue = value === "true" ? "false" : "true";
          setHoleOption(holeNumber, optionName, otherValue);
        }
        // For non-binary, tapping the current value is a no-op
        return;
      }

      // Set this hole to the new value
      setHoleOption(holeNumber, optionName, value);
    },
    [specOption, gameDefault, holeValueMap, setHoleOption, optionName],
  );

  // Display a value in human-readable form
  const getValueDisplay = useCallback(
    (value: string): string => {
      if (!specOption) return value;

      if (specOption.valueType === "bool") {
        return value === "true" ? "Yes" : "No";
      }
      if (specOption.valueType === "menu" && specOption.choices) {
        const choice = specOption.choices.find((c) => c.name === value);
        return choice ? choice.disp : value;
      }
      return value;
    },
    [specOption],
  );

  // "Add Value" for numeric options
  const [newValueInput, setNewValueInput] = useState("");

  const handleAddValue = useCallback(() => {
    const trimmed = newValueInput.trim();
    if (!trimmed) return;
    const num = Number.parseFloat(trimmed);
    if (Number.isNaN(num)) return;

    // No need to write anything yet — the value section will appear
    // once the user assigns holes to it. But we need to add it to distinct values.
    // We'll add it by setting the first hole without an override to this value.
    // Actually, just show it as an empty section — the user can tap holes into it.
    setAdditionalValues((prev) => {
      if (prev.includes(trimmed) || distinctValues.includes(trimmed))
        return prev;
      return [...prev, trimmed];
    });
    setNewValueInput("");
  }, [newValueInput, distinctValues]);

  const [additionalValues, setAdditionalValues] = useState<string[]>([]);

  const allValues = useMemo(() => {
    const merged = new Set([...distinctValues, ...additionalValues]);
    return Array.from(merged).sort((a, b) => {
      if (a === gameDefault) return -1;
      if (b === gameDefault) return 1;
      return a.localeCompare(b);
    });
  }, [distinctValues, additionalValues, gameDefault]);

  if (!specOption || !gameDefault) {
    return (
      <Screen>
        <View style={styles.header}>
          <Back />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Customize Option</Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{specOption.disp}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.helpText}>
          Tap holes to assign them to a value. The game default is{" "}
          {getValueDisplay(gameDefault)}.
        </Text>

        {allValues.map((value) => {
          const holes = getHolesForValue(value);
          const isDefault = value === gameDefault;

          return (
            <View key={value} style={styles.section}>
              <OptionSectionHeader
                title={`${getValueDisplay(value)}${isDefault ? " (default)" : ""}`}
              />
              <View style={styles.chooserContainer}>
                <HoleChooser
                  totalHoles={totalHoles}
                  selectedHoles={holes}
                  onHoleToggle={(h) => handleHoleToggle(value, h)}
                />
              </View>
            </View>
          );
        })}

        {specOption.valueType === "num" && (
          <View style={styles.addValueSection}>
            <OptionSectionHeader title="Add Value" />
            <View style={styles.addValueRow}>
              <View style={styles.addValueInput}>
                <Input
                  label="New value"
                  keyboardType="numeric"
                  value={newValueInput}
                  onChangeText={setNewValueInput}
                  placeholder="e.g. 16"
                />
              </View>
              <View style={styles.addValueButton}>
                <Button label="Add" onPress={handleAddValue} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(1),
    paddingVertical: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  titleContainer: {
    flex: 1,
    marginLeft: theme.gap(1),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.gap(1),
    paddingBottom: theme.gap(4),
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginBottom: theme.gap(1),
  },
  section: {
    marginBottom: theme.gap(1.5),
  },
  chooserContainer: {
    paddingHorizontal: theme.gap(0.5),
    paddingTop: theme.gap(0.75),
  },
  addValueSection: {
    marginTop: theme.gap(1),
  },
  addValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.gap(1),
    paddingHorizontal: theme.gap(0.5),
    paddingTop: theme.gap(0.75),
  },
  addValueInput: {
    flex: 1,
  },
  addValueButton: {
    paddingBottom: theme.gap(0.25),
  },
}));
