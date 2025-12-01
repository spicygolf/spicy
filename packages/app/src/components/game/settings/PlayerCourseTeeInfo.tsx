import { useEffect, useState } from "react";
import { StyleSheet } from "react-native-unistyles";
import type { Round } from "spicylib/schema";
import { courseAcronym } from "spicylib/utils";
import { Text } from "@/ui";

interface PlayerCourseTeeInfoProps {
  round: Round | null;
}

export function PlayerCourseTeeInfo({ round }: PlayerCourseTeeInfoProps) {
  const [courseTeeName, setCourseTeeName] = useState<string | null>(null);

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
          setCourseTeeName(displayName);
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

  return <Text style={styles.text}>{courseTeeName}</Text>;
}

const styles = StyleSheet.create(() => ({
  text: {
    flex: 1,
    fontSize: 14,
  },
}));
