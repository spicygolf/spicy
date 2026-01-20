import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { calculateCourseHandicap, formatCourseHandicap } from "spicylib/utils";
import { Back } from "@/components/Back";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Input, Screen, Text } from "@/ui";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "HandicapAdjustment"
>;

/**
 * Filter input to only allow valid handicap index characters.
 * Allows optional leading + (for plus handicaps), digits, and one decimal point.
 * Note: In golf, "+" means plus handicap (better than scratch). There's no
 * such thing as a negative handicap index in user input - just use the number.
 */
function filterHandicapIndexInput(input: string): string {
  // Remove any invalid characters, keeping only +, digits, and decimal point
  // Only allow + at the start
  let filtered = input.replace(/[^+\d.]/g, "");
  // Remove + if not at start
  if (filtered.indexOf("+") > 0) {
    filtered = filtered.replace(/\+/g, "");
  }
  // Only allow one decimal point
  const parts = filtered.split(".");
  if (parts.length > 2) {
    filtered = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return filtered;
}

/**
 * Filter input to only allow valid game handicap characters.
 * Allows optional leading + (for plus handicaps), and digits only (integers).
 */
function filterGameHandicapInput(input: string): string {
  // Remove any invalid characters, keeping only + and digits
  let filtered = input.replace(/[^+\d]/g, "");
  // Remove + if not at start
  if (filtered.indexOf("+") > 0) {
    filtered = filtered.replace(/\+/g, "");
  }
  return filtered;
}

export function HandicapAdjustment({ route, navigation }: Props) {
  const { playerId, roundToGameId } = route.params;
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { name: true } },
      rounds: {
        $each: {
          handicapIndex: true,
          courseHandicap: true,
          gameHandicap: true,
          round: {
            playerId: true,
            handicapIndex: true,
            tee: true,
          },
        },
      },
    },
  });
  const { theme } = useUnistyles();

  const player = useMemo(() => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) return null;
    return (
      game.players.find(
        (p: MaybeLoaded<(typeof game.players)[0]>) =>
          p?.$isLoaded && p.$jazz.id === playerId,
      ) || null
    );
  }, [game, playerId]);

  const roundToGame = useMemo(() => {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded || !roundToGameId)
      return null;
    return (
      game.rounds.find(
        (rtg: MaybeLoaded<(typeof game.rounds)[0]>) =>
          rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
      ) || null
    );
  }, [game, roundToGameId]);

  const round = useMemo(() => {
    if (!roundToGame?.$isLoaded || !roundToGame.round?.$isLoaded) return null;
    return roundToGame.round;
  }, [roundToGame]);

  const originalHandicapIndex = useMemo(() => {
    if (round?.$isLoaded) {
      return round.handicapIndex;
    }
    return "0.0";
  }, [round]);

  const currentHandicapIndex = useMemo(() => {
    if (roundToGame?.$isLoaded) {
      return roundToGame.handicapIndex;
    }
    return originalHandicapIndex;
  }, [roundToGame, originalHandicapIndex]);

  const hasIndexOverride = useMemo(() => {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return false;
    return roundToGame.handicapIndex !== round.handicapIndex;
  }, [roundToGame, round]);

  // Local input state
  const [indexInput, setIndexInput] = useState(currentHandicapIndex);
  const [gameHandicapInput, setGameHandicapInput] = useState("");

  // Live preview of course handicap based on current index input
  const previewCourseHandicap = useMemo(() => {
    if (!round?.$isLoaded || !round.tee?.$isLoaded) return null;
    return calculateCourseHandicap({
      handicapIndex: indexInput,
      tee: round.tee,
      holesPlayed: "all18",
    });
  }, [round, indexInput]);

  const currentGameHandicap = useMemo(() => {
    if (roundToGame?.$isLoaded && roundToGame.gameHandicap !== undefined) {
      return roundToGame.gameHandicap;
    }
    return null;
  }, [roundToGame]);

  const hasGameHandicapOverride = currentGameHandicap !== null;

  // Sync index input when Jazz data changes (e.g., after clearing override)
  useEffect(() => {
    setIndexInput(currentHandicapIndex);
  }, [currentHandicapIndex]);

  // Sync game handicap input: show override if exists, otherwise show calculated preview
  useEffect(() => {
    if (currentGameHandicap !== null) {
      setGameHandicapInput(formatCourseHandicap(currentGameHandicap));
    } else if (previewCourseHandicap !== null) {
      setGameHandicapInput(formatCourseHandicap(previewCourseHandicap));
    } else {
      setGameHandicapInput("");
    }
  }, [currentGameHandicap, previewCourseHandicap]);

  // Refs for beforeRemove listener
  const indexInputRef = useRef(indexInput);
  const gameHandicapInputRef = useRef(gameHandicapInput);
  const previewCourseHandicapRef = useRef(previewCourseHandicap);
  indexInputRef.current = indexInput;
  gameHandicapInputRef.current = gameHandicapInput;
  previewCourseHandicapRef.current = previewCourseHandicap;

  function saveIndexOverride(inputValue: string) {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;

    const trimmed = inputValue.trim();
    if (trimmed === "") return;

    if (trimmed !== originalHandicapIndex) {
      roundToGame.$jazz.set("handicapIndex", trimmed);
    } else if (roundToGame.handicapIndex !== round.handicapIndex) {
      roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
    }
  }

  function saveGameHandicapOverride(
    inputValue: string,
    calculatedHandicap: number | null,
  ) {
    if (!roundToGame?.$isLoaded) return;

    const calculatedStr =
      calculatedHandicap !== null
        ? formatCourseHandicap(calculatedHandicap)
        : "";

    if (inputValue.trim() === "" || inputValue === calculatedStr) {
      // User cleared it or matches calculated - remove override
      if (roundToGame.$jazz.has("gameHandicap")) {
        roundToGame.$jazz.delete("gameHandicap");
      }
    } else {
      // Parse and save override
      const trimmed = inputValue.trim();
      const isPlus = trimmed.startsWith("+");
      let parsed = Number.parseInt(trimmed.replace(/^\+/, ""), 10);
      if (!Number.isNaN(parsed)) {
        // Plus handicap (e.g., "+5") is stored as negative (-5)
        if (isPlus) parsed = -parsed;
        roundToGame.$jazz.set("gameHandicap", parsed);
      }
    }
  }

  // Save pending changes when navigating away (blur doesn't fire on back press)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Uses refs for current values, functions are stable
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      saveIndexOverride(indexInputRef.current);
      saveGameHandicapOverride(
        gameHandicapInputRef.current,
        previewCourseHandicapRef.current,
      );
    });
    return unsubscribe;
  }, [navigation]);

  function handleClearIndexOverride() {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;
    roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
  }

  function handleClearGameHandicap() {
    if (!roundToGame?.$isLoaded) return;
    if (roundToGame.$jazz.has("gameHandicap")) {
      roundToGame.$jazz.delete("gameHandicap");
    }
  }

  if (!player?.$isLoaded) {
    return null;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <View style={styles.title}>
          <Text style={styles.titleText}>Handicap Adjustment</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
        <Text style={styles.playerName}>{player.name}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Handicap Index</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Original:</Text>
            <Text style={styles.value}>{originalHandicapIndex}</Text>
          </View>
          {hasIndexOverride && (
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Current Override:</Text>
              <Text style={styles.value}>{currentHandicapIndex}</Text>
            </View>
          )}
          <Text style={styles.helpText}>
            Override the handicap index for this round
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Input
                label=""
                value={indexInput}
                onChangeText={(text) =>
                  setIndexInput(filterHandicapIndexInput(text))
                }
                onBlur={() => saveIndexOverride(indexInput)}
                placeholder="e.g., 12.5 or +2.3"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {hasIndexOverride && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearIndexOverride}
              >
                <FontAwesome6
                  name="delete-left"
                  size={18}
                  color={theme.colors.secondary}
                  iconStyle="solid"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Course Handicap</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Calculated:</Text>
            <Text style={styles.value}>
              {previewCourseHandicap !== null
                ? formatCourseHandicap(previewCourseHandicap)
                : "N/A"}
            </Text>
          </View>
          {round?.$isLoaded &&
            round.tee?.$isLoaded &&
            round.tee.ratings?.total && (
              <Text style={styles.helpText}>
                Using slope: {round.tee.ratings.total.slope}, rating:{" "}
                {round.tee.ratings.total.rating}
              </Text>
            )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Game Handicap</Text>
          {hasGameHandicapOverride && (
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Current Override:</Text>
              <Text style={styles.value}>
                {formatCourseHandicap(currentGameHandicap)}
              </Text>
            </View>
          )}
          <Text style={styles.helpText}>
            Override the course handicap with an agreed-upon value
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Input
                label=""
                value={gameHandicapInput}
                onChangeText={(text) =>
                  setGameHandicapInput(filterGameHandicapInput(text))
                }
                onBlur={() =>
                  saveGameHandicapOverride(
                    gameHandicapInput,
                    previewCourseHandicap,
                  )
                }
                placeholder="e.g., 10 or +2"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {hasGameHandicapOverride && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearGameHandicap}
              >
                <FontAwesome6
                  name="delete-left"
                  size={18}
                  color={theme.colors.secondary}
                  iconStyle="solid"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(2),
  },
  title: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.gap(2),
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.gap(3),
  },
  section: {
    marginBottom: theme.gap(3),
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(0.5),
  },
  valueLabel: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginRight: theme.gap(1),
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
  },
  helpText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(1),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  inputWrapper: {
    flex: 1,
  },
  clearButton: {
    padding: theme.gap(1),
  },
}));
