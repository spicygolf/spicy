import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useMemo, useState } from "react";
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

export function HandicapAdjustment({ route }: Props) {
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

  const calculatedCourseHandicap = useMemo(() => {
    if (!round?.$isLoaded || !round.tee?.$isLoaded) return null;

    return calculateCourseHandicap({
      handicapIndex: currentHandicapIndex,
      tee: round.tee,
      holesPlayed: "all18",
    });
  }, [round, currentHandicapIndex]);

  const currentGameHandicap = useMemo(() => {
    if (roundToGame?.$isLoaded && roundToGame.gameHandicap !== undefined) {
      return roundToGame.gameHandicap;
    }
    return null;
  }, [roundToGame]);

  const hasGameHandicapOverride = currentGameHandicap !== null;

  // Local state for input fields (for typing), synced on blur
  const [indexInput, setIndexInput] = useState(currentHandicapIndex);
  const [gameHandicapInput, setGameHandicapInput] = useState(
    currentGameHandicap !== null
      ? formatCourseHandicap(currentGameHandicap)
      : calculatedCourseHandicap !== null
        ? formatCourseHandicap(calculatedCourseHandicap)
        : "",
  );

  // Sync local state when Jazz data changes (e.g., after clearing override)
  useMemo(() => {
    setIndexInput(currentHandicapIndex);
  }, [currentHandicapIndex]);

  useMemo(() => {
    if (currentGameHandicap !== null) {
      setGameHandicapInput(formatCourseHandicap(currentGameHandicap));
    } else if (calculatedCourseHandicap !== null) {
      setGameHandicapInput(formatCourseHandicap(calculatedCourseHandicap));
    }
  }, [currentGameHandicap, calculatedCourseHandicap]);

  function handleIndexBlur() {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;

    if (indexInput !== originalHandicapIndex) {
      // User entered a different value - store override
      roundToGame.$jazz.set("handicapIndex", indexInput);
    } else if (roundToGame.handicapIndex !== round.handicapIndex) {
      // User set it back to original - remove override
      roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
    }
  }

  function handleGameHandicapBlur() {
    if (!roundToGame?.$isLoaded) return;

    const calculatedStr =
      calculatedCourseHandicap !== null
        ? formatCourseHandicap(calculatedCourseHandicap)
        : "";

    if (
      gameHandicapInput.trim() === "" ||
      gameHandicapInput === calculatedStr
    ) {
      // User cleared it or set to calculated - remove override
      if (roundToGame.$jazz.has("gameHandicap")) {
        roundToGame.$jazz.set("gameHandicap", undefined);
      }
    } else {
      // User entered a different value - store override
      let parsed = Number.parseInt(gameHandicapInput.replace("+", ""), 10);
      if (!Number.isNaN(parsed)) {
        if (gameHandicapInput.startsWith("+")) {
          parsed = -parsed;
        }
        roundToGame.$jazz.set("gameHandicap", parsed);
      }
    }
  }

  function handleClearIndexOverride() {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;
    roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
  }

  function handleClearGameHandicap() {
    if (!roundToGame?.$isLoaded) return;
    if (roundToGame.$jazz.has("gameHandicap")) {
      roundToGame.$jazz.set("gameHandicap", undefined);
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
                onChangeText={setIndexInput}
                onBlur={handleIndexBlur}
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
              {calculatedCourseHandicap !== null
                ? formatCourseHandicap(calculatedCourseHandicap)
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
                onChangeText={setGameHandicapInput}
                onBlur={handleGameHandicapBlur}
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
