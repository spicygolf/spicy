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
import { Button, Input, Screen, Text } from "@/ui";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "HandicapAdjustment"
>;

export function HandicapAdjustment({ route, navigation }: Props) {
  const { playerId, roundToGameId } = route.params;
  const { game } = useGame();
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

  const storedCourseHandicap = useMemo(() => {
    if (roundToGame?.$isLoaded && roundToGame.courseHandicap !== undefined) {
      return roundToGame.courseHandicap;
    }
    return null;
  }, [roundToGame]);

  const calculatedCourseHandicap = useMemo(() => {
    if (!round?.$isLoaded || !round.tee?.$isLoaded) return null;

    return calculateCourseHandicap({
      handicapIndex: currentHandicapIndex,
      tee: round.tee,
      holesPlayed: "all18",
    });
  }, [round, currentHandicapIndex]);

  const defaultGameHandicapValue = useMemo(() => {
    if (roundToGame?.$isLoaded && roundToGame.gameHandicap !== undefined) {
      return formatCourseHandicap(roundToGame.gameHandicap);
    }
    if (storedCourseHandicap !== null)
      return formatCourseHandicap(storedCourseHandicap);
    if (calculatedCourseHandicap !== null)
      return formatCourseHandicap(calculatedCourseHandicap);
    return "";
  }, [roundToGame, storedCourseHandicap, calculatedCourseHandicap]);

  const [handicapIndex, setHandicapIndex] = useState(currentHandicapIndex);
  const [gameHandicap, setGameHandicap] = useState(defaultGameHandicapValue);

  function handleSave() {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;

    // Handle handicap index
    if (handicapIndex !== originalHandicapIndex) {
      // User changed it - store the override
      roundToGame.$jazz.set("handicapIndex", handicapIndex);
    } else if (roundToGame.handicapIndex !== round.handicapIndex) {
      // User set it back to original - remove the override
      roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
    }

    // Handle game handicap
    const calculatedHandicapStr =
      calculatedCourseHandicap !== null
        ? formatCourseHandicap(calculatedCourseHandicap)
        : "";

    if (gameHandicap.trim() === "") {
      // User cleared it - remove override if it exists
      if (roundToGame.$jazz.has("gameHandicap")) {
        roundToGame.$jazz.set("gameHandicap", undefined);
      }
    } else if (gameHandicap !== calculatedHandicapStr) {
      // User changed it to something different from calculated - store override
      let parsedGameHandicap = Number.parseInt(
        gameHandicap.replace("+", ""),
        10,
      );
      if (!Number.isNaN(parsedGameHandicap)) {
        if (gameHandicap.startsWith("+")) {
          parsedGameHandicap = -parsedGameHandicap;
        }
        roundToGame.$jazz.set("gameHandicap", parsedGameHandicap);
      }
    } else {
      // User set it to match calculated - remove override if it exists
      if (roundToGame.$jazz.has("gameHandicap")) {
        roundToGame.$jazz.set("gameHandicap", undefined);
      }
    }

    navigation.goBack();
  }

  function handleClearIndexOverride() {
    if (!roundToGame?.$isLoaded || !round?.$isLoaded) return;
    setHandicapIndex(originalHandicapIndex);
    roundToGame.$jazz.set("handicapIndex", round.handicapIndex);
  }

  function handleClearGameHandicap() {
    if (!roundToGame?.$isLoaded) return;
    const calculatedHandicapStr =
      calculatedCourseHandicap !== null
        ? formatCourseHandicap(calculatedCourseHandicap)
        : "";
    setGameHandicap(calculatedHandicapStr);
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
          {currentHandicapIndex !== originalHandicapIndex && (
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
                value={handicapIndex}
                onChangeText={setHandicapIndex}
                placeholder="e.g., 12.5 or +2.3"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {roundToGame?.$isLoaded &&
              roundToGame.$isLoaded &&
              round?.$isLoaded &&
              round.$isLoaded &&
              roundToGame.handicapIndex !== round.handicapIndex && (
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
          {storedCourseHandicap !== null &&
            storedCourseHandicap !== calculatedCourseHandicap && (
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Stored Override:</Text>
                <Text style={styles.value}>
                  {formatCourseHandicap(storedCourseHandicap)}
                </Text>
              </View>
            )}
          {round?.$isLoaded &&
            round.tee?.$isLoaded &&
            round.tee.ratings?.$isLoaded && (
              <Text style={styles.helpText}>
                Using slope:{" "}
                {round.tee.ratings.total?.$isLoaded
                  ? round.tee.ratings.total.slope
                  : "N/A"}
                , rating:{" "}
                {round.tee.ratings.total?.$isLoaded
                  ? round.tee.ratings.total.rating
                  : "N/A"}
              </Text>
            )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Game Handicap</Text>
          {roundToGame?.$isLoaded && roundToGame.gameHandicap !== undefined && (
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Current:</Text>
              <Text style={styles.value}>
                {formatCourseHandicap(roundToGame.gameHandicap)}
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
                value={gameHandicap}
                onChangeText={setGameHandicap}
                placeholder="e.g., 10 or +2"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {roundToGame?.$isLoaded &&
              roundToGame.$isLoaded &&
              roundToGame.gameHandicap !== undefined && (
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

      <View style={styles.buttons}>
        <Button label="Save" onPress={handleSave} />
      </View>
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
  buttons: {
    paddingTop: theme.gap(2),
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
