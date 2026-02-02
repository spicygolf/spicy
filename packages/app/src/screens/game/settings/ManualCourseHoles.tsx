/**
 * Hole details entry screen for manual course/tee creation.
 *
 * Allows entry of par and handicap (allocation) for each hole.
 * Creates the Course and Tee Jazz objects on save.
 * For 18 holes, displays front 9 and back 9 side by side.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useEffect, useState } from "react";
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

interface HoleRowProps {
  holeNumber: number;
  hole: HoleData;
  onParChange: (par: number) => void;
  onHandicapChange: (handicap: string) => void;
}

function HoleRow({
  holeNumber,
  hole,
  onParChange,
  onHandicapChange,
}: HoleRowProps): React.ReactElement {
  return (
    <View style={styles.holeRow}>
      <Text style={styles.holeNumber}>{holeNumber}</Text>
      <View style={styles.parPicker}>
        <Picker
          title="Par"
          items={PAR_OPTIONS}
          selectedValue={hole.par.toString()}
          onValueChange={(value) => onParChange(Number.parseInt(value, 10))}
        />
      </View>
      <TextInput
        value={hole.handicap.toString()}
        onChangeText={(text) => onHandicapChange(filterIntegerInput(text))}
        keyboardType="number-pad"
        maxLength={2}
        style={styles.hdcpInput}
      />
    </View>
  );
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
    isEditMode = false,
  } = route.params;

  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true } },
      rounds: { $each: { round: { course: true, tee: { holes: true } } } },
    },
  });

  const numHoles = holesCount;
  const is18Holes = numHoles === 18;

  // Initialize holes with default par 4 and sequential handicap
  const [holes, setHoles] = useState<HoleData[]>(() =>
    Array.from({ length: numHoles }, (_, i) => ({
      par: 4,
      handicap: i + 1,
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

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

  // Initialize holes from existing tee data in edit mode
  const existingTee = round?.tee;
  useEffect(() => {
    if (hasInitialized) return;
    if (!isEditMode || !existingTee?.$isLoaded || !existingTee.holes?.$isLoaded)
      return;

    const existingHoles = existingTee.holes;
    if (existingHoles.length > 0) {
      const loadedHoles: HoleData[] = [];
      for (let i = 0; i < numHoles; i++) {
        const hole = existingHoles[i];
        if (hole?.$isLoaded) {
          loadedHoles.push({
            par: hole.par || 4,
            handicap: hole.handicap || i + 1,
          });
        } else {
          loadedHoles.push({ par: 4, handicap: i + 1 });
        }
      }
      setHoles(loadedHoles);
    }
    setHasInitialized(true);
  }, [isEditMode, existingTee, numHoles, hasInitialized]);

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

    // Build ratings
    const rating = courseRating || (numHoles === 18 ? 72 : 36);
    const slope = slopeRating || 113;

    const ratings = {
      total: { rating, slope, bogey: 0 },
      front: { rating: rating / 2, slope, bogey: 0 },
      back: { rating: rating / 2, slope, bogey: 0 },
    };

    const yardage = totalYardage || 0;

    // Check if we're editing an existing manual course
    const existingCourse = round.course;
    const existingTeeObj = round.tee;

    if (
      isEditMode &&
      existingCourse?.$isLoaded &&
      existingTeeObj?.$isLoaded &&
      existingTeeObj.holes?.$isLoaded
    ) {
      // Update existing course
      existingCourse.$jazz.set("name", courseName);

      // Update existing tee
      existingTeeObj.$jazz.set("name", teeName);
      existingTeeObj.$jazz.set("gender", teeGender);
      existingTeeObj.$jazz.set("totalYardage", yardage);
      existingTeeObj.$jazz.set(
        "totalMeters",
        yardage ? Math.round(yardage * 0.9144) : 0,
      );
      existingTeeObj.$jazz.set("ratings", ratings);

      // Update each hole
      const existingHoles = existingTeeObj.holes;
      for (let i = 0; i < holes.length; i++) {
        const hole = existingHoles[i];
        if (hole?.$isLoaded) {
          hole.$jazz.set("par", holes[i].par);
          hole.$jazz.set("handicap", holes[i].handicap);
        }
      }

      // Propagate updates to other players
      if (game?.$isLoaded && player?.$isLoaded) {
        propagateCourseTeeToPlayers(
          game,
          existingCourse,
          existingTeeObj,
          player.$jazz.id,
        );
      }
    } else {
      // Create new course and tee
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
    }

    setIsSubmitting(false);

    // Navigate back to game settings tabs (pop both ManualCourseHoles and SelectCourseNavigator)
    navigation.popToTop();
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
    isEditMode,
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

  // Split holes for side-by-side layout (18 holes only)
  const frontNine = is18Holes ? holes.slice(0, 9) : holes;
  const backNine = is18Holes ? holes.slice(9, 18) : [];

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

        {is18Holes ? (
          // Side-by-side layout for 18 holes
          <View style={styles.twoColumnContainer}>
            {/* Front 9 */}
            <View style={styles.nineColumn}>
              <Text style={styles.nineHeader}>Front 9</Text>
              <View style={styles.columnHeaderRow}>
                <Text style={styles.columnHeader}>#</Text>
                <Text style={styles.columnHeader}>Par</Text>
                <Text style={styles.columnHeader}>Hdcp</Text>
              </View>
              {frontNine.map((hole, index) => (
                <HoleRow
                  key={`front-${index + 1}`}
                  holeNumber={index + 1}
                  hole={hole}
                  onParChange={(par) => updateHolePar(index, par)}
                  onHandicapChange={(hcp) => updateHoleHandicap(index, hcp)}
                />
              ))}
            </View>

            {/* Back 9 */}
            <View style={styles.nineColumn}>
              <Text style={styles.nineHeader}>Back 9</Text>
              <View style={styles.columnHeaderRow}>
                <Text style={styles.columnHeader}>#</Text>
                <Text style={styles.columnHeader}>Par</Text>
                <Text style={styles.columnHeader}>Hdcp</Text>
              </View>
              {backNine.map((hole, index) => (
                <HoleRow
                  key={`back-${index + 10}`}
                  holeNumber={index + 10}
                  hole={hole}
                  onParChange={(par) => updateHolePar(index + 9, par)}
                  onHandicapChange={(hcp) => updateHoleHandicap(index + 9, hcp)}
                />
              ))}
            </View>
          </View>
        ) : (
          // Single column for 9 holes
          <View style={styles.singleColumn}>
            <View style={styles.columnHeaderRow}>
              <Text style={styles.columnHeader}>#</Text>
              <Text style={styles.columnHeader}>Par</Text>
              <Text style={styles.columnHeader}>Hdcp</Text>
            </View>
            {holes.map((hole, index) => (
              <HoleRow
                key={`hole-${index + 1}`}
                holeNumber={index + 1}
                hole={hole}
                onParChange={(par) => updateHolePar(index, par)}
                onHandicapChange={(hcp) => updateHoleHandicap(index, hcp)}
              />
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            label={
              isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Course & Tee"
            }
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
  twoColumnContainer: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  nineColumn: {
    flex: 1,
  },
  singleColumn: {
    flex: 1,
  },
  nineHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
    textAlign: "center",
  },
  columnHeaderRow: {
    flexDirection: "row",
    paddingBottom: theme.gap(0.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.gap(0.5),
  },
  columnHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
  },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.25),
  },
  holeNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  parPicker: {
    flex: 1,
  },
  hdcpInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: theme.gap(3),
    paddingHorizontal: theme.gap(2),
  },
}));
