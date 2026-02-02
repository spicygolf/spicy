/**
 * Hole details entry screen for manual course/tee creation.
 *
 * Allows entry of par and handicap (allocation) for each hole.
 * Creates the Course and Tee Jazz objects on save.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  CourseDefaultTee,
  Course as CourseSchema,
  ListOfTeeHoles,
  ListOfTees,
  TeeHole,
  Tee as TeeSchema,
} from "spicylib/schema";
import { Back } from "@/components/Back";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Picker, Screen, Text, TextInput } from "@/ui";
import { propagateCourseTeeToPlayers } from "@/utils/propagateCourseTee";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "ManualCourseHoles"
>;

interface HoleData {
  par: number;
  handicap: number;
}

const PAR_OPTIONS = [
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

/**
 * Filter input for integers only.
 */
function filterIntegerInput(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function ManualCourseHoles({
  route,
  navigation,
}: Props): React.ReactElement {
  const {
    playerId,
    roundId,
    courseName,
    teeName,
    teeGender,
    holesCount,
    totalYardage,
    courseRating,
    slopeRating,
  } = route.params;

  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true } },
      rounds: { $each: { round: true } },
    },
  });

  const numHoles = holesCount;

  // Initialize holes with default par 4 and sequential handicap
  const [holes, setHoles] = useState<HoleData[]>(() =>
    Array.from({ length: numHoles }, (_, i) => ({
      par: 4,
      handicap: i + 1,
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find player from game
  const player = (() => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) return null;
    return (
      game.players.find(
        (p: MaybeLoaded<(typeof game.players)[0]>) =>
          p?.$isLoaded && p.$jazz.id === playerId,
      ) || null
    );
  })();

  // Find round via game.rounds (RoundToGame)
  const round = (() => {
    if (!roundId || !game?.$isLoaded || !game.rounds?.$isLoaded) return null;
    const rtg = game.rounds.find(
      (r) => r?.$isLoaded && r.round?.$isLoaded && r.round.$jazz.id === roundId,
    );
    return rtg?.$isLoaded && rtg.round?.$isLoaded ? rtg.round : null;
  })();

  const updateHolePar = useCallback((index: number, par: number): void => {
    setHoles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], par };
      return updated;
    });
  }, []);

  const updateHoleHandicap = useCallback(
    (index: number, handicapStr: string): void => {
      const handicap = handicapStr ? Number.parseInt(handicapStr, 10) : 1;
      if (!Number.isNaN(handicap) && handicap >= 1 && handicap <= 18) {
        setHoles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], handicap };
          return updated;
        });
      }
    },
    [],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!round?.$isLoaded) return;

    setIsSubmitting(true);

    const group = round.$jazz.owner;

    // Generate unique IDs for manual entries
    const courseId = `manual-${Date.now()}`;
    const teeId = `manual-tee-${Date.now()}`;

    // Create TeeHole objects
    const teeHoles: TeeHole[] = holes.map((hole, i) =>
      TeeHole.create(
        {
          id: `${teeId}-hole-${i + 1}`,
          number: i + 1,
          par: hole.par,
          yards: 0,
          meters: 0,
          handicap: hole.handicap,
        },
        { owner: group },
      ),
    );

    // Build ratings
    const rating = courseRating || (numHoles === 18 ? 72 : 36);
    const slope = slopeRating || 113;

    const ratings = {
      total: { rating, slope, bogey: 0 },
      front: { rating: rating / 2, slope, bogey: 0 },
      back: { rating: rating / 2, slope, bogey: 0 },
    };

    const yardage = totalYardage || 0;

    // Create Tee
    const tee = TeeSchema.create(
      {
        id: teeId,
        name: teeName,
        gender: teeGender,
        holes: ListOfTeeHoles.create(teeHoles, { owner: group }),
        holesCount: numHoles,
        totalYardage: yardage,
        totalMeters: yardage ? Math.round(yardage * 0.9144) : 0,
        ratings,
      },
      { owner: group },
    );

    // Create Course
    const course = CourseSchema.create(
      {
        id: courseId,
        status: "active",
        name: courseName,
        city: "",
        state: "",
        season: { all_year: true },
        default_tee: CourseDefaultTee.create({}, { owner: group }),
        tees: ListOfTees.create([tee], { owner: group }),
      },
      { owner: group },
    );

    // Set on round
    round.$jazz.set("course", course);
    round.$jazz.set("tee", tee);

    // Propagate to other players
    if (game?.$isLoaded && player?.$isLoaded) {
      propagateCourseTeeToPlayers(game, course, tee, player.$jazz.id);
    }

    setIsSubmitting(false);

    // Navigate all the way back to game settings
    // Pop twice: once from ManualCourseHoles, once from SelectCourseNavigator
    navigation.getParent()?.getParent()?.goBack();
  }, [
    round,
    holes,
    courseRating,
    slopeRating,
    totalYardage,
    teeName,
    teeGender,
    courseName,
    numHoles,
    game,
    player,
    navigation,
  ]);

  if (!player || !round) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </Screen>
    );
  }

  // Calculate total par
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Hole Details</Text>
          <Text style={styles.subtitle}>
            {courseName} - {teeName}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {numHoles} holes • Total Par: {totalPar}
          </Text>
        </View>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.holeColumn]}>Hole</Text>
          <Text style={[styles.headerCell, styles.parColumn]}>Par</Text>
          <Text style={[styles.headerCell, styles.hdcpColumn]}>Hdcp</Text>
        </View>

        {holes.map((hole, index) => (
          <View key={`hole-${index + 1}`} style={styles.holeRow}>
            <Text style={[styles.holeNumber, styles.holeColumn]}>
              {index + 1}
            </Text>
            <View style={styles.parColumn}>
              <Picker
                title="Par"
                items={PAR_OPTIONS}
                selectedValue={hole.par.toString()}
                onValueChange={(value) =>
                  updateHolePar(index, Number.parseInt(value, 10))
                }
              />
            </View>
            <View style={styles.hdcpColumn}>
              <TextInput
                value={hole.handicap.toString()}
                onChangeText={(text) =>
                  updateHoleHandicap(index, filterIntegerInput(text))
                }
                keyboardType="number-pad"
                maxLength={2}
                style={styles.hdcpInput}
              />
            </View>
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <Button
            label={isSubmitting ? "Saving..." : "Save Course & Tee"}
            onPress={handleSave}
            disabled={isSubmitting}
          />
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
  titleContainer: {
    flex: 1,
    marginLeft: theme.gap(1),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: theme.gap(4),
  },
  summaryRow: {
    marginBottom: theme.gap(2),
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.gap(1),
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.5),
  },
  holeColumn: {
    width: 50,
  },
  parColumn: {
    width: 80,
    marginRight: theme.gap(2),
  },
  hdcpColumn: {
    width: 60,
  },
  holeNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  hdcpInput: {
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: theme.gap(3),
    paddingHorizontal: theme.gap(2),
  },
}));
