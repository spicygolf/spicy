import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Course, Tee } from "spicylib/schema";
import { normalizeGender } from "spicylib/utils";
import { Back } from "@/components/Back";
import { GhinCourseSearchInput } from "@/components/ghin/course/SearchInput";
import { GhinCourseSearchResults } from "@/components/ghin/course/SearchResults";
import { TeeSelection } from "@/components/ghin/course/TeeSelection";
import { useGameContext } from "@/contexts/GameContext";
import {
  GhinCourseSearchProvider,
  useGhinCourseSearchContext,
} from "@/contexts/GhinCourseSearchContext";
import { useGhinCourseDetailsQuery } from "@/hooks/useGhinCourseDetailsQuery";
import { useGhinSearchCourseQuery } from "@/hooks/useGhinSearchCourseQuery";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Screen, Text } from "@/ui";

type Props = NativeStackScreenProps<
  GameSettingsStackParamList,
  "SelectCourseTee"
>;

function SelectCourseTeeContent({ route, navigation }: Props) {
  const { playerId, roundId } = route.params;
  const { game } = useGameContext();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Get the player from the game context
  const player = useMemo(() => {
    if (!game?.players) {
      return null;
    }
    return game.players.find((p) => p?.$jazz.id === playerId) || null;
  }, [game?.players, playerId]);

  // Get the round if roundId is provided
  const round = useMemo(() => {
    if (!roundId || !player?.rounds) return null;
    return player.rounds.find((r) => r?.$jazz.id === roundId) || null;
  }, [player?.rounds, roundId]);

  // Course search hook
  const { state: searchState } = useGhinCourseSearchContext();
  const courseSearchQuery = useGhinSearchCourseQuery(searchState);

  // Course details hook (when a course is selected)
  const courseDetailsQuery = useGhinCourseDetailsQuery({
    course_id: selectedCourseId || 0,
    include_altered_tees: false,
  });

  const handleSelectCourse = useCallback((courseId: number) => {
    setSelectedCourseId(courseId);
  }, []);

  const handleSelectTee = useCallback(
    async (teeId: number, _teeName: string) => {
      if (!round || !selectedCourseId || !courseDetailsQuery.data) {
        return;
      }

      const courseData = courseDetailsQuery.data;
      const teeData = courseData.TeeSets.find(
        (t) => t.TeeSetRatingId === teeId,
      );

      if (!teeData) {
        return;
      }

      // Get the group owner for Jazz objects
      const group = round.$jazz.owner;

      const facilityData = courseData.Facility;
      const facility = facilityData
        ? {
            id: facilityData.FacilityId.toString(),
            status: facilityData.FacilityStatus,
            name: facilityData.FacilityName,
            number: facilityData.FacilityNumber?.toString(),
            geolocation: {
              formatted_address: facilityData.GeoLocationFormattedAddress || "",
              latitude: facilityData.GeoLocationLatitude || 0,
              longitude: facilityData.GeoLocationLongitude || 0,
            },
          }
        : undefined;

      // Create Tee holes
      const holes = teeData.Holes.map((h) => ({
        id: h.HoleId.toString(),
        number: h.Number,
        par: h.Par,
        yards: h.Length,
        meters: Math.round(h.Length * 0.9144), // Convert yards to meters
        handicap: h.Allocation,
      }));

      // Create ratings
      const ratings = {
        total: {
          rating: 0,
          slope: 0,
          bogey: 0,
        },
        front: {
          rating: 0,
          slope: 0,
          bogey: 0,
        },
        back: {
          rating: 0,
          slope: 0,
          bogey: 0,
        },
      };

      teeData.Ratings.forEach((r) => {
        const ratingKey = r.RatingType.toLowerCase() as
          | "total"
          | "front"
          | "back";
        if (ratingKey in ratings) {
          ratings[ratingKey] = {
            rating: r.CourseRating,
            slope: r.SlopeRating,
            bogey: r.BogeyRating,
          };
        }
      });

      // Use upsertUnique for Tee to avoid duplicates
      const teeValue = {
        id: teeData.TeeSetRatingId.toString(),
        name: teeData.TeeSetRatingName,
        gender: normalizeGender(teeData.Gender),
        holes,
        holesCount: teeData.HolesNumber,
        totalYardage: teeData.TotalYardage,
        totalMeters: teeData.TotalMeters,
        ratings,
      };

      const upsertedTee = await Tee.upsertUnique({
        value: teeValue,
        unique: teeData.TeeSetRatingId.toString(),
        owner: group,
      });

      if (!upsertedTee) {
        console.error("Failed to upsert tee");
        return;
      }

      // Ensure the tee is loaded
      const tee = await upsertedTee.$jazz.ensureLoaded({
        resolve: { holes: { $each: true } },
      });

      // Use upsertUnique for Course to avoid duplicates
      const courseValue = {
        id: courseData.CourseId.toString(),
        status: courseData.CourseStatus,
        name: courseData.CourseName,
        number: courseData.CourseNumber?.toString(),
        city: courseData.CourseCity,
        state: courseData.CourseState,
        facility,
        season: {
          name: courseData.Season.SeasonName,
          start_date: courseData.Season.SeasonStartDate || undefined,
          end_date: courseData.Season.SeasonEndDate || undefined,
          all_year: courseData.Season.IsAllYear,
        },
        default_tee: {
          male: player?.gender === "M" ? tee : undefined,
          female: player?.gender === "F" ? tee : undefined,
        },
        tees: [tee],
      };

      const upsertedCourse = await Course.upsertUnique({
        value: courseValue,
        unique: courseData.CourseId.toString(),
        owner: group,
      });

      if (!upsertedCourse) {
        console.error("Failed to upsert course");
        return;
      }

      // Ensure the course is loaded
      const course = await upsertedCourse.$jazz.ensureLoaded({
        resolve: { tees: { $each: true }, facility: true },
      });

      // Initialize tees list if it doesn't exist
      if (!course.$jazz.has("tees")) {
        course.$jazz.set("tees", [tee]);
      }

      // Update the round with course and tee
      round.$jazz.set("course", course);
      round.$jazz.set("tee", tee);

      // Navigate back
      navigation.goBack();
    },
    [round, selectedCourseId, courseDetailsQuery.data, player, navigation],
  );

  if (!player) {
    return (
      <View style={styles.container}>
        <Text>Player not found</Text>
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Back />
        <View style={styles.title}>
          <Text style={styles.titleText}>Select Course & Tees</Text>
          <Text style={styles.subtitleText}>{player.name}</Text>
        </View>
      </View>

      {!selectedCourseId ? (
        <>
          <GhinCourseSearchInput />
          <GhinCourseSearchResults
            results={courseSearchQuery.data}
            loading={courseSearchQuery.isLoading}
            error={courseSearchQuery.error}
            onSelectCourse={handleSelectCourse}
          />
        </>
      ) : courseDetailsQuery.data ? (
        <TeeSelection
          courseDetails={courseDetailsQuery.data}
          onSelectTee={handleSelectTee}
          playerGender={player.gender}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Loading course details...</Text>
        </View>
      )}
    </Screen>
  );
}

export function SelectCourseTee(props: Props) {
  return (
    <GhinCourseSearchProvider>
      <SelectCourseTeeContent {...props} />
    </GhinCourseSearchProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.gap(2),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(2),
  },
  title: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitleText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}));
