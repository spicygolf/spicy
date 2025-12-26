import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Round, TeeStatus } from "spicylib/schema";
import { Text } from "@/ui";

interface RoundCourseTeeNameProps {
  round: MaybeLoaded<Round> | null;
}

interface CourseTeeData {
  displayName: string;
  status: TeeStatus | undefined;
}

export function RoundCourseTeeName({ round }: RoundCourseTeeNameProps) {
  const [courseTeeName, setCourseTeeName] = useState<
    CourseTeeData | string | null
  >("Loading...");

  useEffect(() => {
    if (!round?.$isLoaded) {
      setCourseTeeName("Loading...");
      return;
    }

    const loadData = async () => {
      // Check if course and tee fields exist before loading
      const hasCourse = round.$jazz.has("course");
      const hasTee = round.$jazz.has("tee");

      if (!hasCourse && !hasTee) {
        setCourseTeeName("No Course • No Tee");
        return;
      }

      if (hasCourse && hasTee) {
        const loadedRound = await round.$jazz.ensureLoaded({
          resolve: {
            course: true,
            tee: true,
          },
        });

        const courseName = loadedRound.course?.$isLoaded
          ? loadedRound.course.name
          : "No Course";
        const teeName = loadedRound.tee?.$isLoaded
          ? loadedRound.tee.name
          : "No Tee";
        const teeStatus = loadedRound.tee?.$isLoaded
          ? loadedRound.tee.status
          : undefined;
        setCourseTeeName({
          displayName: `${courseName} • ${teeName}`,
          status: teeStatus,
        });
      } else if (hasCourse) {
        const loadedRound = await round.$jazz.ensureLoaded({
          resolve: {
            course: true,
          },
        });
        const courseName = loadedRound.course?.$isLoaded
          ? loadedRound.course.name
          : "No Course";
        setCourseTeeName(`${courseName} • No Tee`);
      } else {
        const loadedRound = await round.$jazz.ensureLoaded({
          resolve: {
            tee: true,
          },
        });
        const teeName = loadedRound.tee?.$isLoaded
          ? loadedRound.tee.name
          : "No Tee";
        setCourseTeeName(`No Course • ${teeName}`);
      }
    };

    loadData();
  }, [round]);

  // Handle string values (loading state, error messages, etc.)
  if (typeof courseTeeName === "string") {
    return <Text style={styles.text}>{courseTeeName}</Text>;
  }

  // Handle null
  if (!courseTeeName) {
    return null;
  }

  // Handle CourseTeeData with badge
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{courseTeeName.displayName}</Text>
      {courseTeeName.status === "inactive" && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>Inactive</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  inactiveBadge: {
    backgroundColor: "#FCD34D",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#78350F",
  },
}));
