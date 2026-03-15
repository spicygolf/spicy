import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import {
  getGameOptionIntArray,
  getGameOptionNumber,
  getPayoutPctsForPlaceCount,
} from "spicylib/scoring";
import { Back } from "@/components/Back";
import { useGame, useIsOrganizer } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Screen, Text, TextInput } from "@/ui";

type Props = NativeStackScreenProps<GameSettingsStackParamList, "PlacesPaid">;

const MIN_PLACES = 1;
const MAX_PLACES = 10;

const PLACE_LABELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
];

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

/** Screen for configuring the number of places paid and their payout percentages. */
export function PlacesPaidScreen(_props: Props) {
  const { theme } = useUnistyles();
  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      players: { $each: true },
    },
  });
  const isOrganizer = useIsOrganizer(game);

  // Read payout_pcts from spec (single source of truth)
  const specPcts = getGameOptionIntArray(game?.spec, "payout_pcts", []);
  const currentPlaces =
    specPcts.length > 0
      ? specPcts.length
      : getGameOptionNumber(game?.spec, "places_paid", 3);
  const buyIn = getGameOptionNumber(game?.spec, "buy_in", 0);

  const playerCount = game?.players?.$isLoaded ? game.players.length : 0;
  const potTotal = buyIn * playerCount;

  // Derive current pcts: payout_pcts value → spec defaultValue map → DEFAULT_PAYOUT_PCTS
  const currentPcts =
    specPcts.length > 0
      ? specPcts
      : getPayoutPctsForPlaceCount(game?.spec, currentPlaces);

  const [places, setPlaces] = useState(currentPlaces);
  const [pcts, setPcts] = useState<number[]>(() => currentPcts);

  // Keep a ref so blur/save callbacks always see the latest pcts
  const pctsRef = useRef(pcts);
  pctsRef.current = pcts;
  const placesRef = useRef(places);
  placesRef.current = places;

  // Sync local state once Jazz data finishes loading
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (synced) return;
    if (!game?.spec?.$isLoaded) return;
    setSynced(true);
    setPlaces(currentPlaces);
    setPcts(currentPcts);
  }, [synced, game?.spec?.$isLoaded, currentPlaces, currentPcts]);

  /** Persist places + pcts to Jazz spec options. */
  const saveToJazz = useCallback(
    (newPlaces: number, newPcts: number[]) => {
      if (!game?.spec?.$isLoaded || isOrganizer === false) return;

      const activePctSlice = newPcts.slice(0, newPlaces);

      // Save payout_pcts game option (single source of truth)
      const existingPctOpt = game.spec.payout_pcts as GameOption;
      game.spec.$jazz.set("payout_pcts", {
        ...existingPctOpt,
        value: JSON.stringify(activePctSlice),
      });

      // Keep places_paid in sync for display
      const existingOpt = game.spec.places_paid as GameOption;
      game.spec.$jazz.set("places_paid", {
        ...existingOpt,
        value: String(newPlaces),
      });
    },
    [game, isOrganizer],
  );

  const handlePlacesChange = useCallback(
    (newPlaces: number) => {
      const clamped = Math.max(MIN_PLACES, Math.min(MAX_PLACES, newPlaces));
      // Look up the spec's defaultValue map for this place count, fall back to DEFAULT_PAYOUT_PCTS
      const newPcts = getPayoutPctsForPlaceCount(game?.spec, clamped);
      setPlaces(clamped);
      setPcts(newPcts);
      // Default pcts always sum to 100 — save immediately
      saveToJazz(clamped, newPcts);
    },
    [game?.spec, saveToJazz],
  );

  const handlePctChange = useCallback(
    (index: number, text: string) => {
      if (text === "") {
        const next = [...pctsRef.current];
        next[index] = 0;
        pctsRef.current = next;
        setPcts(next);
        return;
      }
      const num = Number.parseInt(text, 10);
      if (Number.isNaN(num) || num < 0 || num > 100) return;
      // Build new array from ref (always current) and update ref immediately
      const next = [...pctsRef.current];
      next[index] = num;
      pctsRef.current = next;
      setPcts(next);
      // Auto-save when percentages sum to 100
      const pl = placesRef.current;
      const activeSlice = next.slice(0, pl);
      if (activeSlice.reduce((s, p) => s + p, 0) === 100) {
        saveToJazz(pl, next);
      }
    },
    [saveToJazz],
  );

  /** Save on blur so edits persist even when the total isn't 100 yet. */
  const handlePctBlur = useCallback(() => {
    saveToJazz(placesRef.current, pctsRef.current);
  }, [saveToJazz]);

  const activePcts = pcts.slice(0, places);
  const amounts = distributeAmounts(potTotal, activePcts);
  const pctTotal = activePcts.reduce((sum, p) => sum + p, 0);
  const isValid = pctTotal === 100;

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
            {activePcts.map((pct, i) => (
              <View key={PLACE_LABELS[i]} style={styles.payoutRow}>
                <Text style={styles.placeLabel}>{PLACE_LABELS[i]}</Text>
                <View style={styles.pctInputWrapper}>
                  <TextInput
                    style={[styles.pctInput, { color: theme.colors.primary }]}
                    value={String(pct)}
                    onChangeText={(text) => handlePctChange(i, text)}
                    onBlur={handlePctBlur}
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
            ))}
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
}));
