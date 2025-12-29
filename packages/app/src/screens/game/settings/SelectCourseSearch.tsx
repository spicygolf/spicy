import type { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import type { MaybeLoaded } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  Course,
  CourseTee,
  Facility,
  Favorites,
  ListOfCourseTees,
  PlayerAccount,
  Tee,
  TeeHole,
} from "spicylib/schema";
import { normalizeGender } from "spicylib/utils";
import { ErrorDisplay } from "@/components/Error";
import { GhinCourseSearchInput } from "@/components/ghin/course/SearchInput";
import { GhinCourseSearchResults } from "@/components/ghin/course/SearchResults";
import { TeeSelection } from "@/components/ghin/course/TeeSelection";
import { useGhinCourseSearchContext } from "@/contexts/GhinCourseSearchContext";
import { useGame } from "@/hooks";
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
  const { game } = useGame(undefined, {
    resolve: {
      players: { $each: { gender: true, rounds: { $each: true } } },
    },
  });
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          courseTees: { $each: { course: true, tee: true } },
        },
      },
    },
  });

  // Direct Jazz data access - no useMemo needed since Jazz reactivity is already optimized
  const player =
    game?.$isLoaded && game.players?.$isLoaded
      ? game.players.find(
          (p: MaybeLoaded<(typeof game.players)[0]>) =>
            p?.$isLoaded && p.$jazz.id === playerId,
        ) || null
      : null;

  const round =
    roundId &&
    player?.$isLoaded &&
    player.$jazz.has("rounds") &&
    player.rounds?.$isLoaded
      ? player.rounds.find(
          (r: MaybeLoaded<(typeof player.rounds)[0]>) =>
            r?.$isLoaded && r.$jazz.id === roundId,
        ) || null
      : null;

  const { state: searchState } = useGhinCourseSearchContext();
  const courseSearchQuery = useGhinSearchCourseQuery(searchState);

  const courseDetailsQuery = useGhinCourseDetailsQuery({
    course_id: selectedCourseId || 0,
  });

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
  };

  const handleBack = () => {
    setSelectedCourseId(null);
  };

  const handleSelectTee = async (
    teeId: number,
    _teeName: string,
    shouldFavorite: boolean,
  ) => {
    if (!round?.$isLoaded || !selectedCourseId || !courseDetailsQuery.data) {
      return;
    }

    const courseData = courseDetailsQuery.data;
    const teeData = courseData.TeeSets.find((t) => t.TeeSetRatingId === teeId);

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
              formatted_address: facilityData.GeoLocationFormattedAddress || "",
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
      total: { rating: 0, slope: 0, bogey: 0 },
      front: { rating: 0, slope: 0, bogey: 0 },
      back: { rating: 0, slope: 0, bogey: 0 },
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
      return;
    }

    const tee = await upsertedTee.$jazz.ensureLoaded({
      resolve: { holes: { $each: true } },
    });

    const createdCourse = Course.create(
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
          male: undefined,
          female: undefined,
        },
        tees: [],
      },
      { owner: group },
    );

    const course = await createdCourse.$jazz.ensureLoaded({ resolve: true });

    if (!course.$isLoaded || !round.$isLoaded) {
      return;
    }

    round.$jazz.set("course", course);
    round.$jazz.set("tee", tee);

    // Handle favoriting if requested
    if (shouldFavorite && me?.$isLoaded && me.root?.$isLoaded) {
      const root = me.root;
      const loaded = await root.$jazz.ensureLoaded({
        resolve: { favorites: { courseTees: { $each: true } } },
      });

      if (!loaded.$jazz.has("favorites")) {
        const favoritesGroup = root.$jazz.owner;
        const newFavorites = Favorites.create(
          {
            courseTees: ListOfCourseTees.create([], {
              owner: favoritesGroup,
            }),
          },
          { owner: favoritesGroup },
        );
        loaded.$jazz.set("favorites", newFavorites);
      }

      const favorites = loaded.favorites;
      if (favorites?.$isLoaded) {
        if (!favorites.$jazz.has("courseTees")) {
          const favoritesGroup = favorites.$jazz.owner;
          favorites.$jazz.set(
            "courseTees",
            ListOfCourseTees.create([], { owner: favoritesGroup }),
          );
        }

        const courseTees = favorites.courseTees;
        if (courseTees?.$isLoaded) {
          const existingIndex = courseTees.findIndex((fav) => {
            return (
              fav?.$isLoaded &&
              fav.$jazz.has("tee") &&
              fav.$jazz.has("course") &&
              fav.tee?.$isLoaded &&
              fav.course?.$isLoaded &&
              fav.tee.id === tee.id &&
              fav.course.id === course.id
            );
          });

          if (existingIndex < 0) {
            const favoritesGroup = courseTees.$jazz.owner;
            const newFavorite = CourseTee.create(
              {
                course,
                tee,
                addedAt: new Date(),
              },
              { owner: favoritesGroup },
            );
            courseTees.$jazz.push(newFavorite);
          }
        }
      }
    }

    navigation.getParent()?.goBack();
  };

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
          <ErrorDisplay
            error={courseDetailsQuery.error}
            title="Couldn't load course details"
            onRetry={() => setSelectedCourseId(null)}
          />
        </View>
      ) : courseDetailsQuery.data ? (
        <TeeSelection
          courseDetails={courseDetailsQuery.data}
          onSelectTee={handleSelectTee}
          onBack={handleBack}
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
