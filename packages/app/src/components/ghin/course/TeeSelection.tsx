import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { CourseDetailsResponse } from "@spicygolf/ghin";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/ui";

interface TeeSelectionProps {
  courseDetails: CourseDetailsResponse;
  onSelectTee: (teeId: number, teeName: string) => void;
  playerGender?: "M" | "F";
}

export function TeeSelection({
  courseDetails,
  onSelectTee,
  playerGender = "M",
}: TeeSelectionProps) {
  // Filter tees based on player gender (includes Mixed tees)
  const availableTees = courseDetails.TeeSets.filter((tee) => {
    if (tee.Gender === "Mixed") return true;
    if (playerGender === "M" && tee.Gender === "Male") return true;
    if (playerGender === "F" && tee.Gender === "Female") return true;
    return false;
  });

  const getRatingInfo = (tee: (typeof courseDetails.TeeSets)[0]) => {
    const totalRating = tee.Ratings.find((r) => r.RatingType === "Total");
    if (!totalRating) return null;

    return {
      rating: totalRating.CourseRating.toFixed(1),
      slope: totalRating.SlopeRating,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{courseDetails.CourseName}</Text>
        <Text style={styles.courseLocation}>
          {courseDetails.CourseCity}, {courseDetails.CourseState}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Select Tees</Text>

      <FlatList
        data={availableTees}
        keyExtractor={(item) => item.TeeSetRatingId.toString()}
        renderItem={({ item }) => {
          const ratingInfo = getRatingInfo(item);

          return (
            <TouchableOpacity
              style={styles.teeItem}
              onPress={() =>
                onSelectTee(item.TeeSetRatingId, item.TeeSetRatingName)
              }
            >
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => {
                  // TODO: Implement favorites when ready
                  console.log("Favorite pressed for tee:", item.TeeSetRatingId);
                }}
              >
                <FontAwesome6
                  name="star"
                  iconStyle="regular"
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>

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
  teeItem: {
    padding: theme.gap(2),
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
  favoriteButton: {
    padding: theme.gap(0.5),
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
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.gap(2),
  },
}));
