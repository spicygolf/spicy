import { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Round, TeeStatus } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";
import { Text } from "@/ui";

interface PlayerCourseTeeInfoProps {
  round: Round | null;
}

interface CourseTeeData {
  displayName: string;
  status: TeeStatus | undefined;
}

export function PlayerCourseTeeInfo({ round }: PlayerCourseTeeInfoProps) {
  const [courseTeeName, setCourseTeeName] = useState<CourseTeeData | null>(
    null,
  );

  useEffect(() => {
    if (!round?.$isLoaded) {
      setCourseTeeName(null);
      return;
    }

    if (!round.$jazz.has("course") || !round.$jazz.has("tee")) {
      setCourseTeeName(null);
      return;
    }

    const loadData = async () => {
      try {
        const loadedRound = await round.$jazz.ensureLoaded({
          resolve: {
            course: true,
            tee: true,
          },
        });

        if (
          loadedRound.course?.$isLoaded &&
          loadedRound.tee?.$isLoaded &&
          loadedRound.course.name &&
          loadedRound.tee.name
        ) {
          const facilityName = loadedRound.course.facility?.$isLoaded
            ? loadedRound.course.facility.name
            : undefined;
          const displayName = `${courseAcronym(loadedRound.course.name, facilityName)} • ${loadedRound.tee.name}`;
          setCourseTeeName({
            displayName,
            status: loadedRound.tee.status,
          });
        } else {
          setCourseTeeName(null);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Failed to load course/tee data:", error);
        }
        setCourseTeeName(null);
      }
    };

    loadData();
  }, [round]);

  if (!courseTeeName) return null;

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

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontSize: 14,
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
