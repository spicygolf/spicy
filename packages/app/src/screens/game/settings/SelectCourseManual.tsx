/**
 * Manual course/tee entry screen for courses not in GHIN database.
 *
 * Creates Course and Tee Jazz objects with default par 4 for all holes.
 * Rating supports decimals, slope is an integer.
 */

import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useState } from "react";
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
import { useGame } from "@/hooks";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import { Button, Picker, Screen, Text, TextInput } from "@/ui";
import { propagateCourseTeeToPlayers } from "@/utils/propagateCourseTee";

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseManual"
>;

const GENDER_OPTIONS = [
  { label: "Mixed", value: "Mixed" },
  { label: "Men", value: "M" },
  { label: "Women", value: "F" },
];

const HOLES_OPTIONS = [
  { label: "18 holes", value: "18" },
  { label: "9 holes", value: "9" },
];

/**
 * Filter input for decimal numbers (course rating).
 */
function filterDecimalInput(input: string): string {
  let filtered = input.replace(/[^\d.]/g, "");
  // Only allow one decimal point
  const parts = filtered.split(".");
  if (parts.length > 2) {
    filtered = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return filtered;
}

/**
 * Filter input for integers only (slope, yardage).
 */
function filterIntegerInput(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function SelectCourseManual({
  route,
  navigation,
}: Props): React.ReactElement {
  const { playerId, roundId } = route.params;
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true } },
      rounds: { $each: { round: true } },
    },
  });

  // Form state
  const [courseName, setCourseName] = useState("");
  const [teeName, setTeeName] = useState("");
  const [teeGender, setTeeGender] = useState<"M" | "F" | "Mixed">("Mixed");
  const [holesCount, setHolesCount] = useState<"9" | "18">("18");
  const [totalYardage, setTotalYardage] = useState("");
  const [courseRating, setCourseRating] = useState("");
  const [slopeRating, setSlopeRating] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!courseName.trim()) {
      newErrors.courseName = "Course name is required";
    }
    if (!teeName.trim()) {
      newErrors.teeName = "Tee name is required";
    }
    if (courseRating.trim()) {
      const rating = Number.parseFloat(courseRating);
      if (Number.isNaN(rating) || rating < 50 || rating > 90) {
        newErrors.courseRating = "Rating should be between 50 and 90";
      }
    }
    if (slopeRating.trim()) {
      const slope = Number.parseInt(slopeRating, 10);
      if (Number.isNaN(slope) || slope < 55 || slope > 155) {
        newErrors.slopeRating = "Slope should be between 55 and 155";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [courseName, teeName, courseRating, slopeRating]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!round?.$isLoaded || !validate()) return;

    setIsSubmitting(true);

    const group = round.$jazz.owner;
    const numHoles = Number.parseInt(holesCount, 10);

    // Generate unique IDs for manual entries
    const courseId = `manual-${Date.now()}`;
    const teeId = `manual-tee-${Date.now()}`;

    // Create TeeHole objects with default par 4 and sequential handicap
    const holes: TeeHole[] = [];
    for (let i = 0; i < numHoles; i++) {
      holes.push(
        TeeHole.create(
          {
            id: `${teeId}-hole-${i + 1}`,
            number: i + 1,
            par: 4,
            yards: 0,
            meters: 0,
            handicap: i + 1,
          },
          { owner: group },
        ),
      );
    }

    // Build ratings (use provided values or defaults)
    const rating = courseRating.trim()
      ? Number.parseFloat(courseRating)
      : numHoles === 18
        ? 72
        : 36;
    const slope = slopeRating.trim() ? Number.parseInt(slopeRating, 10) : 113;

    const ratings = {
      total: { rating, slope, bogey: 0 },
      front: { rating: rating / 2, slope, bogey: 0 },
      back: { rating: rating / 2, slope, bogey: 0 },
    };

    const yardage = totalYardage.trim() ? Number.parseInt(totalYardage, 10) : 0;

    // Create Tee
    const tee = TeeSchema.create(
      {
        id: teeId,
        name: teeName.trim(),
        gender: teeGender,
        holes: ListOfTeeHoles.create(holes, { owner: group }),
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
        name: courseName.trim(),
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
    navigation.getParent()?.goBack();
  }, [
    round,
    validate,
    holesCount,
    courseRating,
    slopeRating,
    totalYardage,
    teeName,
    teeGender,
    courseName,
    game,
    player,
    navigation,
  ]);

  if (!player) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>Loading player data...</Text>
        </View>
      </Screen>
    );
  }

  if (!round) {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text>No round selected</Text>
        </View>
      </Screen>
    );
  }

  const isValid = courseName.trim() && teeName.trim();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={styles.label}>Course Name</Text>
            <TextInput
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g., Pebble Beach"
              autoCapitalize="words"
              hasError={!!errors.courseName}
            />
            {errors.courseName ? (
              <Text style={styles.errorText}>{errors.courseName}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tee Name</Text>
            <TextInput
              value={teeName}
              onChangeText={setTeeName}
              placeholder="e.g., Blue, White, Red"
              autoCapitalize="words"
              hasError={!!errors.teeName}
            />
            {errors.teeName ? (
              <Text style={styles.errorText}>{errors.teeName}</Text>
            ) : null}
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Gender</Text>
              <Picker
                title="Select gender"
                items={GENDER_OPTIONS}
                selectedValue={teeGender}
                onValueChange={(value) =>
                  setTeeGender(value as "M" | "F" | "Mixed")
                }
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Holes</Text>
              <Picker
                title="Select holes"
                items={HOLES_OPTIONS}
                selectedValue={holesCount}
                onValueChange={(value) => setHolesCount(value as "9" | "18")}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Total Yardage (optional)</Text>
            <TextInput
              value={totalYardage}
              onChangeText={(text) => setTotalYardage(filterIntegerInput(text))}
              placeholder="e.g., 6500"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Course Rating (optional)</Text>
              <TextInput
                value={courseRating}
                onChangeText={(text) =>
                  setCourseRating(filterDecimalInput(text))
                }
                placeholder="e.g., 72.5"
                keyboardType="decimal-pad"
                hasError={!!errors.courseRating}
              />
              {errors.courseRating ? (
                <Text style={styles.errorText}>{errors.courseRating}</Text>
              ) : null}
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Slope Rating (optional)</Text>
              <TextInput
                value={slopeRating}
                onChangeText={(text) =>
                  setSlopeRating(filterIntegerInput(text))
                }
                placeholder="e.g., 135"
                keyboardType="number-pad"
                hasError={!!errors.slopeRating}
              />
              {errors.slopeRating ? (
                <Text style={styles.errorText}>{errors.slopeRating}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.helperText}>
            All holes default to par 4. Rating and slope are used for handicap
            calculations.
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              label={isSubmitting ? "Saving..." : "Save Course & Tee"}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  scrollContent: {
    padding: theme.gap(2),
  },
  field: {
    marginBottom: theme.gap(2),
  },
  halfField: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: theme.gap(2),
    marginBottom: theme.gap(2),
  },
  label: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginBottom: theme.gap(0.5),
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.gap(0.5),
  },
  helperText: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginBottom: theme.gap(2),
  },
  buttonContainer: {
    marginTop: theme.gap(1),
  },
}));
