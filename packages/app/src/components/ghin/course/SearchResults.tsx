import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { CourseSearchResponse } from "@spicygolf/ghin";
import { useMemo } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, Text } from "@/ui";

interface CourseSearchResultsProps {
  results: CourseSearchResponse | undefined;
  loading: boolean;
  error?: Error | null;
  onSelectCourse: (courseId: number) => void;
}

export function GhinCourseSearchResults({
  results,
  loading,
  error,
  onSelectCourse,
}: CourseSearchResultsProps) {
  const courses = useMemo(() => {
    // Handle both old format (with .courses) and new format (direct array)
    if (!results) return [];
    return Array.isArray(results) ? results : results.courses || [];
  }, [results]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Searching for courses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={styles.centerContainer}>
        <Text>Select a state to search for courses</Text>
      </View>
    );
  }

  if (courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>No courses found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => item.CourseID.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.courseItem}
          onPress={() => onSelectCourse(item.CourseID)}
        >
          <View style={styles.courseInfo}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{item.CourseName}</Text>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => {
                  // TODO: Implement favorites when ready
                  console.log("Favorite pressed for course:", item.CourseID);
                }}
              >
                <FontAwesome6
                  name="star"
                  iconStyle="regular"
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.facilityName}>{item.FacilityName}</Text>
            <Text style={styles.courseLocation}>
              {item.City}, {item.State}
            </Text>
            {item.CourseStatus === "INACTIVE" && (
              <Text style={styles.inactiveStatus}>Inactive</Text>
            )}
          </View>
          <View style={styles.selectButton}>
            <Button
              label="Select Tees"
              onPress={() => onSelectCourse(item.CourseID)}
            />
          </View>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  errorText: {
    color: theme.colors.error,
  },
  listContainer: {
    paddingBottom: theme.gap(2),
  },
  courseItem: {
    padding: theme.gap(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
    marginRight: theme.gap(2),
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  favoriteButton: {
    padding: theme.gap(0.5),
    marginLeft: theme.gap(1),
  },
  facilityName: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  courseLocation: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  inactiveStatus: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: theme.gap(0.5),
    fontStyle: "italic",
  },
  selectButton: {
    minWidth: 100,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
}));
