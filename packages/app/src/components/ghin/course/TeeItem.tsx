import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { CourseDetailsResponse } from "@spicygolf/ghin";
import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CourseTee } from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Text } from "@/ui";

interface TeeSetData {
  TeeSetRatingId: number;
  TeeSetRatingName: string;
  Gender: string | null;
  TotalYardage: number;
  TotalPar: number;
  Ratings: Array<{
    RatingType: string;
    CourseRating: number;
    SlopeRating: number;
  }>;
}

interface TeeItemProps {
  tee: TeeSetData;
  courseDetails: CourseDetailsResponse;
  favoriteTees: readonly MaybeLoaded<CourseTee>[];
  onSelectTee: (
    teeId: number,
    teeName: string,
    shouldFavorite: boolean,
  ) => void;
}

export function TeeItem({
  tee,
  courseDetails,
  favoriteTees,
  onSelectTee,
}: TeeItemProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      const teeIdStr = tee.TeeSetRatingId.toString();
      const courseIdStr = courseDetails.CourseId.toString();

      for (const fav of favoriteTees) {
        if (!fav?.$isLoaded) continue;

        // Load course and tee to check IDs
        const loadedFav = await fav.$jazz.ensureLoaded({
          resolve: {
            course: true,
            tee: true,
          },
        });

        if (
          loadedFav.tee?.$isLoaded &&
          loadedFav.course?.$isLoaded &&
          loadedFav.tee.id === teeIdStr &&
          loadedFav.course.id === courseIdStr
        ) {
          setIsFavorited(true);
          return;
        }
      }
      setIsFavorited(false);
    };

    checkFavorite();
  }, [tee.TeeSetRatingId, courseDetails.CourseId, favoriteTees]);

  const getRatingInfo = () => {
    const totalRating = tee.Ratings.find(
      (r: { RatingType: string }) => r.RatingType === "Total",
    );
    if (!totalRating) return null;

    return {
      rating: totalRating.CourseRating.toFixed(1),
      slope: totalRating.SlopeRating,
    };
  };

  const ratingInfo = getRatingInfo();

  return (
    <TouchableOpacity
      style={styles.teeItem}
      onPress={() =>
        onSelectTee(tee.TeeSetRatingId, tee.TeeSetRatingName, isFavorited)
      }
    >
      <FavoriteButton
        isFavorited={isFavorited}
        onToggle={(newState) => {
          onSelectTee(tee.TeeSetRatingId, tee.TeeSetRatingName, newState);
        }}
        size={20}
      />

      <View style={styles.teeInfo}>
        <Text style={styles.teeName}>{tee.TeeSetRatingName}</Text>

        <View style={styles.teeDetails}>
          <Text style={styles.teeDetailText}>
            {tee.Gender} • {tee.TotalYardage} yards • Par {tee.TotalPar}
          </Text>
          {ratingInfo && (
            <Text style={styles.teeRating}>
              Rating: {ratingInfo.rating} / Slope: {ratingInfo.slope}
            </Text>
          )}
        </View>
      </View>

      <FontAwesome6
        name="chevron-right"
        iconStyle="solid"
        size={16}
        color="#999"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  teeItem: {
    paddingVertical: theme.gap(2),
    paddingRight: theme.gap(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  teeInfo: {
    flex: 1,
    marginLeft: theme.gap(1),
  },
  teeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  teeDetails: {
    marginTop: theme.gap(0.5),
  },
  teeDetailText: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  teeRating: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
}));
