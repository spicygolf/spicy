import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { co, z } from "jazz-tools";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { DEFAULT_PAYOUT_PCTS } from "spicylib/scoring";
import { Back } from "@/components/Back";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Screen, Text, TextInput } from "@/ui";

type Props = NativeStackScreenProps<GameSettingsStackParamList, "PlacesPaid">;

const MIN_PLACES = 1;
const MAX_PLACES = 5;

function getDefaultPcts(places: number): number[] {
  return DEFAULT_PAYOUT_PCTS[places] ?? DEFAULT_PAYOUT_PCTS[3] ?? [50, 30, 20];
}

const PLACE_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

/** Distribute potTotal across pcts so rounded amounts sum exactly to potTotal. */
function distributeAmounts(potTotal: number, pcts: number[]): number[] {
  if (potTotal <= 0) return pcts.map(() => 0);
  const raw = pcts.map((p) => (potTotal * p) / 100);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = potTotal - floored.reduce((s, v) => s + v, 0);
  const fractions = raw.map((v, i) => ({ i, frac: v - (floored[i] ?? 0) }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (const { i } of fractions) {
    if (remainder <= 0) break;
    floored[i] = (floored[i] ?? 0) + 1;
    remainder--;
  }
  return floored;
}

export function PlacesPaidScreen({ navigation }: Props) {
  const { theme } = useUnistyles();
  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      players: { $each: true },
      payoutPools: { $each: { payoutPcts: true } },
    },
  });

  // Derive values directly from Jazz reactive data (no useMemo — Jazz handles reactivity)
  const currentPlaces = (() => {
    if (!game?.spec?.$isLoaded) return 3;
    const opt = game.spec.places_paid;
    if (!opt || opt.type !== "game") return 3;
    const val = (opt as GameOption).value ?? (opt as GameOption).defaultValue;
    return Number.parseInt(val, 10) || 3;
  })();

  const buyIn = (() => {
    if (!game?.spec?.$isLoaded) return 0;
    const opt = game.spec.buy_in;
    if (!opt || opt.type !== "game") return 0;
    const val = (opt as GameOption).value ?? (opt as GameOption).defaultValue;
    return Number.parseFloat(val) || 0;
  })();

  const playerCount = game?.players?.$isLoaded ? game.players.length : 0;
  const potTotal = buyIn * playerCount;

  const currentPoolPcts = (() => {
    if (!game?.payoutPools?.$isLoaded) return null;
    for (const pool of game.payoutPools) {
      if (pool?.$isLoaded && pool.splitType === "places" && pool.placesPaid) {
        if (pool.payoutPcts?.$isLoaded && pool.payoutPcts.length > 0) {
          return Array.from(pool.payoutPcts) as number[];
        }
        return null;
      }
    }
    return null;
  })();

  const [places, setPlaces] = useState(currentPlaces);
  const [pcts, setPcts] = useState<number[]>(
    () => currentPoolPcts ?? getDefaultPcts(currentPlaces),
  );

  const handlePlacesChange = useCallback((newPlaces: number) => {
    const clamped = Math.max(MIN_PLACES, Math.min(MAX_PLACES, newPlaces));
    setPlaces(clamped);
    setPcts(getDefaultPcts(clamped));
  }, []);

  const handlePctChange = useCallback((index: number, text: string) => {
    // Allow empty string so user can clear and retype
    if (text === "") {
      setPcts((prev) => {
        const next = [...prev];
        next[index] = 0;
        return next;
      });
      return;
    }
    const num = Number.parseInt(text, 10);
    if (Number.isNaN(num) || num < 0 || num > 100) return;
    setPcts((prev) => {
      const next = [...prev];
      next[index] = num;
      return next;
    });
  }, []);

  const pctTotal = pcts.reduce((sum, p) => sum + p, 0);
  const isValid = pctTotal === 100;

  const handleSave = useCallback(() => {
    if (!game?.spec?.$isLoaded || !isValid) return;

    // Save places_paid game option
    const existingOpt = game.spec.places_paid;
    if (existingOpt && existingOpt.type === "game") {
      game.spec.$jazz.set("places_paid", {
        ...(existingOpt as GameOption),
        value: String(places),
      });
    }

    // Update payout pools - set placesPaid and payoutPcts on all "places" type pools
    if (game.payoutPools?.$isLoaded) {
      const activePcts = pcts.slice(0, places);
      for (const pool of game.payoutPools) {
        if (pool?.$isLoaded && pool.splitType === "places") {
          pool.$jazz.set("placesPaid", places);
          const pctsList = co.list(z.number()).create(activePcts, {
            owner: pool.$jazz.owner,
          });
          pool.$jazz.set("payoutPcts", pctsList);
        }
      }
    }

    navigation.goBack();
  }, [game, places, pcts, isValid, navigation]);

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <Text style={styles.headerTitle}>Places Paid</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Places Paid Stepper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Places</Text>
          <View style={styles.stepper}>
            <Pressable
              style={[
                styles.stepperButton,
                places <= MIN_PLACES && styles.stepperButtonDisabled,
              ]}
              onPress={() => handlePlacesChange(places - 1)}
              disabled={places <= MIN_PLACES}
              hitSlop={8}
            >
              <FontAwesome6
                name="minus"
                iconStyle="solid"
                size={16}
                color={
                  places <= MIN_PLACES
                    ? theme.colors.border
                    : theme.colors.primary
                }
              />
            </Pressable>
            <Text style={styles.stepperValue}>{places}</Text>
            <Pressable
              style={[
                styles.stepperButton,
                places >= MAX_PLACES && styles.stepperButtonDisabled,
              ]}
              onPress={() => handlePlacesChange(places + 1)}
              disabled={places >= MAX_PLACES}
              hitSlop={8}
            >
              <FontAwesome6
                name="plus"
                iconStyle="solid"
                size={16}
                color={
                  places >= MAX_PLACES
                    ? theme.colors.border
                    : theme.colors.primary
                }
              />
            </Pressable>
          </View>
        </View>

        {/* Pot Summary */}
        {potTotal > 0 && (
          <View style={styles.potSummary}>
            <Text style={styles.potLabel}>
              {playerCount} players x ${buyIn} buy-in
            </Text>
            <Text style={styles.potTotal}>Total Pot: ${potTotal}</Text>
          </View>
        )}

        {/* Payout Percentages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Split</Text>
          <View style={styles.payoutTable}>
            <View style={styles.payoutHeaderRow}>
              <Text style={styles.payoutHeaderPlace}>Place</Text>
              <Text style={styles.payoutHeaderPct}>%</Text>
              {potTotal > 0 && (
                <Text style={styles.payoutHeaderAmount}>Amount</Text>
              )}
            </View>
            {(() => {
              const activePcts = pcts.slice(0, places);
              const amounts = distributeAmounts(potTotal, activePcts);
              return activePcts.map((pct, i) => (
                <View key={PLACE_LABELS[i]} style={styles.payoutRow}>
                  <Text style={styles.placeLabel}>{PLACE_LABELS[i]}</Text>
                  <View style={styles.pctInputWrapper}>
                    <TextInput
                      style={[styles.pctInput, { color: theme.colors.primary }]}
                      value={String(pct)}
                      onChangeText={(text) => handlePctChange(i, text)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      maxLength={3}
                    />
                    <Text style={styles.pctSuffix}>%</Text>
                  </View>
                  {potTotal > 0 && (
                    <Text style={styles.amountText}>${amounts[i]}</Text>
                  )}
                </View>
              ));
            })()}
          </View>

          {/* Total validation */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text
              style={[styles.totalValue, !isValid && styles.totalValueInvalid]}
            >
              {pctTotal}%
            </Text>
          </View>
          {!isValid && (
            <Text style={styles.validationError}>
              Percentages must add up to 100%
            </Text>
          )}
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  headerRight: {
    width: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.gap(2),
    gap: theme.gap(2.5),
  },
  section: {
    gap: theme.gap(1),
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(3),
    paddingVertical: theme.gap(1),
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.primary,
    minWidth: 40,
    textAlign: "center",
  },
  potSummary: {
    backgroundColor: `${theme.colors.action}10`,
    borderRadius: 8,
    padding: theme.gap(1.5),
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  potLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  potTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.action,
  },
  payoutTable: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  payoutHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1.5),
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  payoutHeaderPlace: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  payoutHeaderPct: {
    width: 80,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
    textAlign: "center",
  },
  payoutHeaderAmount: {
    width: 80,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.secondary,
    textAlign: "right",
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  placeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  pctInputWrapper: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pctInput: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    width: 40,
    paddingVertical: theme.gap(0.5),
    paddingHorizontal: theme.gap(0.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
  },
  pctSuffix: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  amountText: {
    width: 80,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.primary,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.gap(1.5),
    paddingTop: theme.gap(0.5),
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.action,
  },
  totalValueInvalid: {
    color: theme.colors.error,
  },
  validationError: {
    fontSize: 12,
    color: theme.colors.error,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: theme.colors.action,
    borderRadius: 8,
    paddingVertical: theme.gap(1.25),
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
}));
