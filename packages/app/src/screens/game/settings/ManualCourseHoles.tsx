/**
 * Hole details entry screen for manual course/tee creation.
 *
 * Allows entry of par and handicap (allocation) for each hole.
 * Creates the Course and Tee Jazz objects on save.
 * For 18 holes, displays front 9 and back 9 side by side.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  CourseDefaultTee,
  Course as CourseSchema,
  ListOfTeeHoles,
  ListOfTees,
  TeeHole,
  Tee as TeeSchema,
} from "spicylib/schema";
import { propagateCourseTeeToPlayers } from "spicylib/utils";
import { Back } from "@/components/Back";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Screen, Text, TextInput } from "@/ui";
import { reportError } from "@/utils/reportError";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "ManualCourseHoles"
>;

interface HoleData {
  par: number | null; // null = not yet entered
  handicap: number | null; // null = not yet entered
  yards: number | null; // null = not yet entered (optional)
}

/**
 * Filter input for integers only.
 */
function filterIntegerInput(input: string): string {
  return input.replace(/[^\d]/g, "");
}

/**
 * Find which handicap values appear more than once or are out of range.
 * For 9-hole courses, valid range is 1-9. For 18-hole courses, 1-18.
 * Returns set of invalid handicap values (excludes null/empty).
 */
function findInvalidHandicaps(
  holes: HoleData[],
  maxHandicap: number,
): Set<number> {
  const counts = new Map<number, number>();
  const invalid = new Set<number>();

  for (const hole of holes) {
    // Skip null/empty handicaps (handled separately)
    if (hole.handicap === null) continue;

    // Check for out-of-range handicaps
    if (hole.handicap < 1 || hole.handicap > maxHandicap) {
      invalid.add(hole.handicap);
    }
    counts.set(hole.handicap, (counts.get(hole.handicap) || 0) + 1);
  }

  // Add duplicates to invalid set
  for (const [handicap, count] of counts) {
    if (count > 1) {
      invalid.add(handicap);
    }
  }

  return invalid;
}

/**
 * Check if all required fields (par, handicap) are filled in.
 */
function hasEmptyRequiredFields(holes: HoleData[]): boolean {
  return holes.some((hole) => hole.par === null || hole.handicap === null);
}

interface HoleRowProps {
  holeNumber: number;
  hole: HoleData;
  onParChange: (par: string) => void;
  onHandicapChange: (handicap: string) => void;
  onYardsChange: (yards: string) => void;
  isDuplicate: boolean;
}

function HoleRow({
  holeNumber,
  hole,
  onParChange,
  onHandicapChange,
  onYardsChange,
  isDuplicate,
}: HoleRowProps): React.ReactElement {
  return (
    <View style={styles.holeRow}>
      <Text style={styles.holeNumber}>{holeNumber}</Text>
      <TextInput
        testID={`hole-${holeNumber}-par`}
        value={hole.par !== null ? hole.par.toString() : ""}
        placeholder=""
        onChangeText={(text) => onParChange(filterIntegerInput(text))}
        keyboardType="number-pad"
        maxLength={1}
        style={styles.parInput}
      />
      <TextInput
        testID={`hole-${holeNumber}-handicap`}
        value={hole.handicap !== null ? hole.handicap.toString() : ""}
        placeholder=""
        onChangeText={(text) => onHandicapChange(filterIntegerInput(text))}
        keyboardType="number-pad"
        maxLength={2}
        style={[styles.hdcpInput, isDuplicate && styles.hdcpInputError]}
        hasError={isDuplicate}
      />
      <TextInput
        testID={`hole-${holeNumber}-yards`}
        value={hole.yards !== null ? hole.yards.toString() : ""}
        placeholder=""
        onChangeText={(text) => onYardsChange(filterIntegerInput(text))}
        keyboardType="number-pad"
        maxLength={3}
        style={styles.yardsInput}
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

  // Initialize holes with empty values (user must fill in par and handicap)
  const [holes, setHoles] = useState<HoleData[]>(() =>
    Array.from({ length: numHoles }, () => ({
      par: null,
      handicap: null,
      yards: null,
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitializedRef = useRef(false);

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
  // Use $jazz.has() to safely check optional refs before accessing
  const existingTee =
    round?.$isLoaded && round.$jazz.has("tee") ? round.tee : null;
  useEffect(() => {
    if (hasInitializedRef.current) return;
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
            yards: hole.yards || null,
          });
        } else {
          loadedHoles.push({ par: 4, handicap: i + 1, yards: null });
        }
      }
      setHoles(loadedHoles);
    }
    hasInitializedRef.current = true;
  }, [isEditMode, existingTee, numHoles]);

  const updateHolePar = useCallback((index: number, parStr: string): void => {
    // Allow empty string (sets to null)
    if (parStr === "") {
      setHoles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], par: null };
        return updated;
      });
      return;
    }

    const par = Number.parseInt(parStr, 10);
    // Allow any single digit par (1-9)
    if (!Number.isNaN(par) && par >= 1 && par <= 9) {
      setHoles((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], par };
        return updated;
      });
    }
  }, []);

  const updateHoleHandicap = useCallback(
    (index: number, handicapStr: string): void => {
      // Allow empty string (sets to null)
      if (handicapStr === "") {
        setHoles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], handicap: null };
          return updated;
        });
        return;
      }

      const handicap = Number.parseInt(handicapStr, 10);
      // Allow values 1-numHoles (9 for 9-hole, 18 for 18-hole courses)
      if (!Number.isNaN(handicap) && handicap >= 1 && handicap <= numHoles) {
        setHoles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], handicap };
          return updated;
        });
      }
    },
    [numHoles],
  );

  const updateHoleYards = useCallback(
    (index: number, yardsStr: string): void => {
      // Allow empty string (sets to null)
      if (yardsStr === "") {
        setHoles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], yards: null };
          return updated;
        });
        return;
      }

      const yards = Number.parseInt(yardsStr, 10);
      // Allow values 1-999
      if (!Number.isNaN(yards) && yards >= 1 && yards <= 999) {
        setHoles((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], yards };
          return updated;
        });
      }
    },
    [],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!round?.$isLoaded) return;

    setIsSubmitting(true);

    try {
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
      // Use $jazz.has() to safely check optional refs before accessing
      const existingCourse =
        round.$jazz.has("course") && round.course?.$isLoaded
          ? round.course
          : null;
      const existingTeeObj =
        round.$jazz.has("tee") && round.tee?.$isLoaded ? round.tee : null;

      if (
        isEditMode &&
        existingCourse &&
        existingTeeObj &&
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

        // Update each hole (handicaps are guaranteed non-null at this point due to validation)
        const existingHoles = existingTeeObj.holes;
        for (let i = 0; i < holes.length; i++) {
          const hole = existingHoles[i];
          if (hole?.$isLoaded) {
            hole.$jazz.set("par", holes[i].par as number);
            hole.$jazz.set("handicap", holes[i].handicap as number);
            const holeYards = holes[i].yards ?? 0;
            hole.$jazz.set("yards", holeYards);
            hole.$jazz.set(
              "meters",
              holeYards ? Math.round(holeYards * 0.9144) : 0,
            );
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

        // Create TeeHole objects (par and handicap are guaranteed non-null at this point due to validation)
        const teeHoles: TeeHole[] = holes.map((hole, i) =>
          TeeHole.create(
            {
              id: `${teeId}-hole-${i + 1}`,
              number: i + 1,
              par: hole.par as number,
              yards: hole.yards ?? 0,
              meters: hole.yards ? Math.round(hole.yards * 0.9144) : 0,
              handicap: hole.handicap as number,
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

      // Navigate back to game settings tabs (pop both ManualCourseHoles and SelectCourseNavigator)
      navigation.popToTop();
    } catch (error) {
      reportError(error as Error, {
        source: "ManualCourseHoles.handleSave",
        context: {
          roundId,
          playerId,
          isEditMode,
          courseName,
          teeName,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
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
    playerId,
    roundId,
  ]);

  // Determine loading vs error states
  const isLoading = !game?.$isLoaded || !game.players?.$isLoaded;
  const playerNotFound = !isLoading && !player;
  const roundNotFound = !isLoading && !round;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (playerNotFound || roundNotFound) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {playerNotFound ? "Player not found" : "Round not found"}
          </Text>
        </View>
      </Screen>
    );
  }

  // Calculate total par (treat null as 0 for display)
  const totalPar = holes.reduce((sum, h) => sum + (h.par ?? 0), 0);

  // Validation: check for empty, duplicate, or out-of-range handicaps
  const invalidHandicaps = findInvalidHandicaps(holes, numHoles);
  const hasInvalidHandicaps = invalidHandicaps.size > 0;
  const hasIncompleteFields = hasEmptyRequiredFields(holes);
  const canSave = !hasInvalidHandicaps && !hasIncompleteFields;

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
            {courseName} - {teeName} • {numHoles} holes • Par {totalPar}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
                  <Text style={styles.columnHeader}>Yds</Text>
                </View>
                {frontNine.map((hole, index) => (
                  <HoleRow
                    key={`front-${index + 1}`}
                    holeNumber={index + 1}
                    hole={hole}
                    onParChange={(par) => updateHolePar(index, par)}
                    onHandicapChange={(hcp) => updateHoleHandicap(index, hcp)}
                    onYardsChange={(yds) => updateHoleYards(index, yds)}
                    isDuplicate={
                      hole.handicap !== null &&
                      invalidHandicaps.has(hole.handicap)
                    }
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
                  <Text style={styles.columnHeader}>Yds</Text>
                </View>
                {backNine.map((hole, index) => (
                  <HoleRow
                    key={`back-${index + 10}`}
                    holeNumber={index + 10}
                    hole={hole}
                    onParChange={(par) => updateHolePar(index + 9, par)}
                    onHandicapChange={(hcp) =>
                      updateHoleHandicap(index + 9, hcp)
                    }
                    onYardsChange={(yds) => updateHoleYards(index + 9, yds)}
                    isDuplicate={
                      hole.handicap !== null &&
                      invalidHandicaps.has(hole.handicap)
                    }
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
                <Text style={styles.columnHeader}>Yds</Text>
              </View>
              {holes.map((hole, index) => (
                <HoleRow
                  key={`hole-${index + 1}`}
                  holeNumber={index + 1}
                  hole={hole}
                  onParChange={(par) => updateHolePar(index, par)}
                  onHandicapChange={(hcp) => updateHoleHandicap(index, hcp)}
                  onYardsChange={(yds) => updateHoleYards(index, yds)}
                  isDuplicate={
                    hole.handicap !== null &&
                    invalidHandicaps.has(hole.handicap)
                  }
                />
              ))}
            </View>
          )}

          {hasIncompleteFields && (
            <Text style={styles.errorText}>
              Enter par and handicap for each hole.
            </Text>
          )}

          {hasInvalidHandicaps && !hasIncompleteFields && (
            <Text style={styles.errorText}>
              Each hole must have a unique handicap value (1-{numHoles}).
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              testID="manual-course-save-button"
              label={
                isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Save Course & Tee"
              }
              onPress={handleSave}
              disabled={isSubmitting || !canSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  keyboardAvoidingView: {
    flex: 1,
  },
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
    fontSize: 12,
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
    flex: 0.5,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  parInput: {
    flex: 0.7,
    textAlign: "center",
    fontSize: 14,
  },
  hdcpInput: {
    flex: 0.7,
    textAlign: "center",
    fontSize: 14,
  },
  yardsInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
  },
  hdcpInputError: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    textAlign: "center",
    marginBottom: theme.gap(1),
  },
  buttonContainer: {
    marginTop: theme.gap(3),
    paddingHorizontal: theme.gap(2),
  },
}));
