import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { MaybeLoaded } from "jazz-tools";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CourseTee, TeeStatus } from "spicylib/schema";
import { stateCode } from "spicylib/utils";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Text } from "@/ui";

interface TeeData {
  teeName: string;
  courseName: string;
  facilityName: string | null;
  city: string;
  state: string;
  gender: string;
  totalYardage: number;
  par: number | null;
  rating: number | null;
  slope: number | null;
  status: TeeStatus | undefined;
}

interface FavoriteTeeItemProps {
  item: MaybeLoaded<CourseTee>;
  drag?: () => void;
  isActive?: boolean;
  onPress: () => void;
  onRemove: () => void;
}

export function FavoriteTeeItem({
  item,
  drag,
  isActive,
  onPress,
  onRemove,
}: FavoriteTeeItemProps) {
  const [teeData, setTeeData] = useState<TeeData | null>(null);

  useEffect(() => {
    if (!item?.$isLoaded) {
      setTeeData(null);
      return;
    }

    const loadData = async () => {
      // Load course and tee data
      const loadedItem = await item.$jazz.ensureLoaded({
        resolve: {
          course: {
            facility: true,
          },
          tee: {
            holes: { $each: true },
          },
        },
      });

      if (!loadedItem.course?.$isLoaded || !loadedItem.tee?.$isLoaded) {
        setTeeData(null);
        return;
      }

      const course = loadedItem.course;
      const tee = loadedItem.tee;

      const par = tee.holes?.$isLoaded
        ? tee.holes.reduce((sum, h) => sum + (h?.$isLoaded ? h.par : 0), 0)
        : null;

      const rating = tee.ratings?.total?.rating ?? null;

      const slope = tee.ratings?.total?.slope ?? null;

      setTeeData({
        teeName: tee.name,
        courseName: course.name,
        facilityName:
          course.facility?.$isLoaded && course.facility.name !== course.name
            ? course.facility.name
            : null,
        city: course.city,
        state: course.state,
        gender: tee.gender,
        totalYardage: tee.totalYardage,
        par,
        rating,
        slope,
        status: tee.status,
      });
    };

    loadData();
  }, [item]);

  if (!teeData) {
    return null;
  }

  const isDraggable = !!drag;

  return (
    <TouchableOpacity
      style={[styles.favoriteItem, isActive && styles.draggingItem]}
      onPress={onPress}
      onLongPress={isDraggable ? drag : undefined}
      delayLongPress={isDraggable ? 200 : undefined}
    >
      <View style={styles.itemRow}>
        <FavoriteButton isFavorited={true} onToggle={onRemove} size={20} />

        <View style={styles.contentArea}>
          <View style={styles.topRow}>
            <View style={styles.favoriteInfo}>
              <View style={styles.teeNameRow}>
                <Text style={styles.teeName}>{teeData.teeName}</Text>
                {teeData.status === "inactive" && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={styles.courseName}>{teeData.courseName}</Text>
              {teeData.facilityName && (
                <Text style={styles.facilityName}>{teeData.facilityName}</Text>
              )}
              <Text style={styles.courseLocation}>
                {teeData.city}, {stateCode(teeData.state)}
              </Text>
            </View>

            {isDraggable && (
              <View style={styles.dragHandle}>
                <FontAwesome6
                  name="grip-lines"
                  iconStyle="solid"
                  size={16}
                  color="#999"
                />
              </View>
            )}
          </View>

          <Text style={styles.teeDetailText}>
            {teeData.gender} • {teeData.totalYardage} yards • Par{" "}
            {teeData.par ?? "—"}
            {teeData.rating !== null && teeData.slope !== null && (
              <>
                {" "}
                • Rating: {teeData.rating.toFixed(1)} • Slope: {teeData.slope}
              </>
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  favoriteItem: {
    paddingVertical: theme.gap(0.5),
    paddingRight: theme.gap(2),
    flexDirection: "column",
    backgroundColor: theme.colors.background,
  },
  draggingItem: {
    opacity: 0.7,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentArea: {
    flex: 1,
    marginLeft: theme.gap(1),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteInfo: {
    flex: 1,
  },
  teeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teeName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inactiveBadge: {
    backgroundColor: "#FCD34D",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#78350F",
  },
  courseName: {
    fontSize: 15,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  facilityName: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.25),
  },
  courseLocation: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  teeDetailText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
  dragHandle: {
    padding: theme.gap(1),
    marginLeft: theme.gap(1),
  },
}));
