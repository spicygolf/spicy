import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native-unistyles";
import type { Round } from "spicylib/schema";
import { Text } from "@/ui";

interface RoundCourseTeeNameProps {
  round: MaybeLoaded<Round> | null;
}

export function RoundCourseTeeName({ round }: RoundCourseTeeNameProps) {
  const [courseTeeName, setCourseTeeName] = useState<string>("Loading...");

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
        setCourseTeeName(`${courseName} • ${teeName}`);
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

  return <Text style={styles.text}>{courseTeeName}</Text>;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
