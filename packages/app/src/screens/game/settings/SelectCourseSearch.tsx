import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { useCallback, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Course, Facility, Tee, TeeHole } from "spicylib/schema";
import { normalizeGender } from "spicylib/utils";
import { GhinCourseSearchInput } from "@/components/ghin/course/SearchInput";
import { GhinCourseSearchResults } from "@/components/ghin/course/SearchResults";
import { TeeSelection } from "@/components/ghin/course/TeeSelection";
import { useGameContext } from "@/contexts/GameContext";
import { useGhinCourseSearchContext } from "@/contexts/GhinCourseSearchContext";
import { useGhinCourseDetailsQuery } from "@/hooks/useGhinCourseDetailsQuery";
import { useGhinSearchCourseQuery } from "@/hooks/useGhinSearchCourseQuery";
import type { SelectCourseTabParamList } from "@/navigators/SelectCourseNavigator";
import { Screen, Text } from "@/ui";

type Props = MaterialTopTabScreenProps<
  SelectCourseTabParamList,
  "SelectCourseSearch"
>;

export function SelectCourseSearch({ route, navigation }: Props) {
  const { playerId, roundId } = route.params;
  const { game } = useGameContext();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const player = useMemo(() => {
    if (!game?.players?.$isLoaded) {
      return null;
    }
    return (
      game.players.find((p) => p?.$isLoaded && p.$jazz.id === playerId) || null
    );
  }, [game?.players, playerId]);

  const round = useMemo(() => {
    if (!roundId || !player?.$isLoaded || !player.rounds?.$isLoaded)
      return null;
    return (
      player.rounds.find((r) => r?.$isLoaded && r.$jazz.id === roundId) || null
    );
  }, [player, roundId]);

  const { state: searchState } = useGhinCourseSearchContext();
  const courseSearchQuery = useGhinSearchCourseQuery(searchState);

  const courseDetailsQuery = useGhinCourseDetailsQuery({
    course_id: selectedCourseId || 0,
  });

  const handleSelectCourse = useCallback((courseId: number) => {
    setSelectedCourseId(courseId);
  }, []);

  const handleSelectTee = useCallback(
    async (teeId: number, _teeName: string) => {
      if (!round?.$isLoaded || !selectedCourseId || !courseDetailsQuery.data) {
        return;
      }

      const courseData = courseDetailsQuery.data;
      const teeData = courseData.TeeSets.find(
        (t) => t.TeeSetRatingId === teeId,
      );

      if (!teeData) {
        return;
      }

      const group = round.$jazz.owner;

      const facilityData = courseData.Facility;
      const facility = facilityData
        ? Facility.create(
            {
              id: facilityData.FacilityId.toString(),
              status: facilityData.FacilityStatus,
              name: facilityData.FacilityName,
              number: facilityData.FacilityNumber?.toString(),
              geolocation: {
                formatted_address:
                  facilityData.GeoLocationFormattedAddress || "",
                latitude: facilityData.GeoLocationLatitude || 0,
                longitude: facilityData.GeoLocationLongitude || 0,
              },
            },
            { owner: group },
          )
        : undefined;

      const holes = teeData.Holes.map((h) =>
        TeeHole.create(
          {
            id: h.HoleId.toString(),
            number: h.Number,
            par: h.Par,
            yards: h.Length,
            meters: Math.round(h.Length * 0.9144),
            handicap: h.Allocation,
          },
          { owner: group },
        ),
      );

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

      const upsertedTee = await Tee.upsertUnique({
        value: {
          id: teeData.TeeSetRatingId.toString(),
          name: teeData.TeeSetRatingName,
          gender: normalizeGender(teeData.Gender),
          holes,
          holesCount: teeData.HolesNumber,
          totalYardage: teeData.TotalYardage,
          totalMeters: teeData.TotalMeters,
          ratings,
        },
        unique: teeData.TeeSetRatingId.toString(),
        owner: group,
      });

      if (!upsertedTee.$isLoaded) {
        console.error("Failed to upsert tee");
        return;
      }

      const tee = await upsertedTee.$jazz.ensureLoaded({
        resolve: { holes: { $each: true } },
      });

      const course = Course.create(
        {
          id: courseData.CourseId.toString(),
          status: courseData.CourseStatus,
          name: courseData.CourseName,
          number: courseData.CourseNumber?.toString(),
          city: courseData.CourseCity,
          state: courseData.CourseState,
          facility,
          season: courseData.Season
            ? {
                name: courseData.Season.SeasonName || undefined,
                start_date: courseData.Season.SeasonStartDate || undefined,
                end_date: courseData.Season.SeasonEndDate || undefined,
                all_year: courseData.Season.IsAllYear,
              }
            : {
                name: undefined,
                start_date: undefined,
                end_date: undefined,
                all_year: true,
              },
          default_tee: {
            male: player?.$isLoaded && player.gender === "M" ? tee : undefined,
            female:
              player?.$isLoaded && player.gender === "F" ? tee : undefined,
          },
          tees: [tee],
        },
        { owner: group },
      );

      round.$jazz.set("course", course);
      round.$jazz.set("tee", tee);

      navigation.getParent()?.goBack();
    },
    [round, selectedCourseId, courseDetailsQuery.data, player, navigation],
  );

  if (!player) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text>Player not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
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
      ) : courseDetailsQuery.isError ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Error loading course details:{" "}
            {courseDetailsQuery.error?.message || "Unknown error"}
          </Text>
          <TouchableOpacity onPress={() => setSelectedCourseId(null)}>
            <Text style={styles.retryText}>← Back to search</Text>
          </TouchableOpacity>
        </View>
      ) : courseDetailsQuery.data ? (
        <TeeSelection
          courseDetails={courseDetailsQuery.data}
          onSelectTee={handleSelectTee}
          playerGender={player.$isLoaded ? player.gender : "M"}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Loading course details...</Text>
          <TouchableOpacity onPress={() => setSelectedCourseId(null)}>
            <Text style={styles.retryText}>← Back to search</Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.gap(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  retryText: {
    color: theme.colors.primary,
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: theme.gap(2),
  },
}));
