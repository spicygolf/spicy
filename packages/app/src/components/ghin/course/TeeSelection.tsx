import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { CourseDetailsResponse } from "@spicygolf/ghin";
import { useAccount } from "jazz-tools/react-native";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { stateCode } from "spicylib/utils";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Text } from "@/ui";

interface TeeSelectionProps {
  courseDetails: CourseDetailsResponse;
  onSelectTee: (
    teeId: number,
    teeName: string,
    shouldFavorite: boolean,
  ) => void;
  onBack?: () => void;
  playerGender?: "M" | "F";
}

export function TeeSelection({
  courseDetails,
  onSelectTee,
  onBack,
  playerGender = "M",
}: TeeSelectionProps) {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        favorites: {
          courseTees: { $each: { course: true, tee: true } },
        },
      },
    },
  });
  // Filter tees based on player gender (includes Mixed tees) and sort by yardage descending
  const availableTees = courseDetails.TeeSets.filter((tee) => {
    if (tee.Gender === "Mixed") return true;
    if (playerGender === "M" && tee.Gender === "Male") return true;
    if (playerGender === "F" && tee.Gender === "Female") return true;
    return false;
  }).sort((a, b) => b.TotalYardage - a.TotalYardage);

  const getRatingInfo = (tee: (typeof courseDetails.TeeSets)[0]) => {
    const totalRating = tee.Ratings.find((r) => r.RatingType === "Total");
    if (!totalRating) return null;

    return {
      rating: totalRating.CourseRating.toFixed(1),
      slope: totalRating.SlopeRating,
    };
  };

  const isTeeInFavorites = (teeId: string, courseId: string): boolean => {
    if (
      !me?.$isLoaded ||
      !me.root?.$isLoaded ||
      !me.root.favorites?.$isLoaded
    ) {
      return false;
    }
    const favorites = me.root.favorites;
    if (!favorites.courseTees?.$isLoaded) {
      return false;
    }
    return favorites.courseTees.some((fav) => {
      return (
        fav?.$isLoaded &&
        fav.tee?.$isLoaded &&
        fav.course?.$isLoaded &&
        fav.tee.id === teeId &&
        fav.course.id === courseId
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.courseHeader}>
        <View style={styles.courseHeaderContent}>
          <View style={styles.courseTextContainer}>
            <Text style={styles.courseName}>{courseDetails.CourseName}</Text>
            <Text style={styles.courseLocation}>
              {courseDetails.CourseCity}, {stateCode(courseDetails.CourseState)}
            </Text>
          </View>
          {onBack && (
            <TouchableOpacity style={styles.closeButton} onPress={onBack}>
              <View style={styles.closeCircle}>
                <FontAwesome6
                  name="xmark"
                  iconStyle="solid"
                  size={14}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Select Tees</Text>

      <FlatList
        data={availableTees}
        keyExtractor={(item) => item.TeeSetRatingId.toString()}
        renderItem={({ item }) => {
          const ratingInfo = getRatingInfo(item);
          const teeIdStr = item.TeeSetRatingId.toString();
          const courseIdStr = courseDetails.CourseId.toString();
          const isFavorited = isTeeInFavorites(teeIdStr, courseIdStr);

          return (
            <View style={styles.teeItem}>
              <TouchableOpacity
                onPress={() =>
                  onSelectTee(item.TeeSetRatingId, item.TeeSetRatingName, true)
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FavoriteButton
                  isFavorited={isFavorited}
                  onToggle={() => {}}
                  size={20}
                  disabled
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.teeContent}
                onPress={() =>
                  onSelectTee(
                    item.TeeSetRatingId,
                    item.TeeSetRatingName,
                    isFavorited,
                  )
                }
              >
                <View style={styles.teeInfo}>
                  <Text style={styles.teeName}>{item.TeeSetRatingName}</Text>

                  <View style={styles.teeDetails}>
                    <Text style={styles.teeDetailText}>
                      {item.Gender} • {item.TotalYardage} yards • Par{" "}
                      {item.TotalPar}
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
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  courseHeader: {
    padding: theme.gap(2),
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  courseHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseTextContainer: {
    flex: 1,
  },
  closeButton: {
    marginLeft: theme.gap(2),
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  courseName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  courseLocation: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: theme.gap(2),
    paddingBottom: theme.gap(1),
  },
  listContainer: {
    paddingBottom: theme.gap(2),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
  teeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  teeContent: {
    flex: 1,
    paddingVertical: theme.gap(2),
    paddingRight: theme.gap(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
