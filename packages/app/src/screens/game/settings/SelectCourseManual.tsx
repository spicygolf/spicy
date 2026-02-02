/**
 * Manual course/tee entry screen - Step 1: Basic course info.
 *
 * Shows edit view if round already has a manual course, otherwise shows create form.
 * Collects course name, tee name, gender, holes, and optional ratings.
 * Navigates to ManualCourseHoles for per-hole par and handicap entry.
 */

import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useGame } from "@/hooks";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Picker, Screen, Text, TextInput } from "@/ui";

/**
 * Check if a course is manually created (has ID starting with "manual-")
 */
function isManualCourse(courseId: string | undefined): boolean {
  return courseId?.startsWith("manual-") ?? false;
}

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseManual"
>;

type StackNavProp = NativeStackNavigationProp<GameSettingsStackParamList>;

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

export function SelectCourseManual({ route }: Props): React.ReactElement {
  const { playerId, roundId } = route.params;
  const stackNavigation = useNavigation<StackNavProp>();
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true } },
      rounds: { $each: { round: { course: true, tee: { holes: true } } } },
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Check if round has a manual course and initialize edit mode
  // Use $jazz.has() to safely check optional refs before accessing
  const existingCourse =
    round?.$isLoaded && round.$jazz.has("course") ? round.course : null;
  const existingTee =
    round?.$isLoaded && round.$jazz.has("tee") ? round.tee : null;
  const hasManualCourse =
    existingCourse?.$isLoaded && isManualCourse(existingCourse.id);

  // Initialize form with existing data when in edit mode
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (
      !hasManualCourse ||
      !existingCourse?.$isLoaded ||
      !existingTee?.$isLoaded
    )
      return;

    setIsEditMode(true);
    setCourseName(existingCourse.name || "");
    setTeeName(existingTee.name || "");
    setTeeGender(existingTee.gender || "Mixed");
    setHolesCount(existingTee.holesCount === 9 ? "9" : "18");
    setTotalYardage(
      existingTee.totalYardage ? String(existingTee.totalYardage) : "",
    );
    setCourseRating(
      existingTee.ratings?.total?.rating
        ? String(existingTee.ratings.total.rating)
        : "",
    );
    setSlopeRating(
      existingTee.ratings?.total?.slope
        ? String(existingTee.ratings.total.slope)
        : "",
    );
    hasInitializedRef.current = true;
  }, [hasManualCourse, existingCourse, existingTee]);

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

  const handleCreateNew = useCallback((): void => {
    // Reset form to create a new course
    setIsEditMode(false);
    setCourseName("");
    setTeeName("");
    setTeeGender("Mixed");
    setHolesCount("18");
    setTotalYardage("");
    setCourseRating("");
    setSlopeRating("");
    setErrors({});
  }, []);

  const handleNext = useCallback((): void => {
    if (!roundId || !validate()) return;

    const numHoles = Number.parseInt(holesCount, 10);
    const rating = courseRating.trim()
      ? Number.parseFloat(courseRating)
      : numHoles === 18
        ? 72
        : 36;
    const slope = slopeRating.trim() ? Number.parseInt(slopeRating, 10) : 113;
    const yardage = totalYardage.trim() ? Number.parseInt(totalYardage, 10) : 0;

    // Navigate to hole details screen
    stackNavigation.navigate("ManualCourseHoles", {
      playerId,
      roundId,
      courseName: courseName.trim(),
      teeName: teeName.trim(),
      teeGender,
      holesCount: numHoles,
      totalYardage: yardage,
      courseRating: rating,
      slopeRating: slope,
      isEditMode,
    });
  }, [
    roundId,
    validate,
    holesCount,
    courseRating,
    slopeRating,
    totalYardage,
    courseName,
    teeName,
    teeGender,
    playerId,
    stackNavigation,
    isEditMode,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isEditMode && (
          <View style={styles.editModeHeader}>
            <Text style={styles.editModeText}>Editing Manual Course</Text>
            <Button
              label="Create New Course"
              onPress={handleCreateNew}
              variant="secondary"
            />
          </View>
        )}

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
              onChangeText={(text) => setCourseRating(filterDecimalInput(text))}
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
              onChangeText={(text) => setSlopeRating(filterIntegerInput(text))}
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
          {isEditMode
            ? "Update the course details and hole information."
            : "Next: Enter par and handicap for each hole."}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            label={isEditMode ? "Edit Hole Details" : "Next: Hole Details"}
            onPress={handleNext}
            disabled={!isValid}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  scrollContent: {
    padding: theme.gap(2),
  },
  editModeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingBottom: theme.gap(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  editModeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
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
