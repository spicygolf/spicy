import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { CourseSearchResponse } from "@spicygolf/ghin";
import { useMemo } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { stateCode } from "spicylib/utils";
import { Text } from "@/ui";

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
        <Text>Enter at least 2 characters of course name to search</Text>
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
            <Text style={styles.courseName}>{item.CourseName}</Text>
            {item.FacilityName !== item.CourseName && (
              <Text style={styles.facilityName}>{item.FacilityName}</Text>
            )}
            <Text style={styles.courseLocation}>
              {item.City}, {stateCode(item.State)}
            </Text>
            {item.CourseStatus === "INACTIVE" && (
              <Text style={styles.inactiveStatus}>Inactive</Text>
            )}
          </View>
          <FontAwesome6
            name="chevron-right"
            iconStyle="solid"
            size={16}
            color="#999"
            style={styles.chevron}
          />
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
    paddingVertical: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
    marginRight: theme.gap(2),
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
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
  chevron: {
    marginLeft: theme.gap(1),
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
}));
