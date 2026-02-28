import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { MaybeLoaded } from "jazz-tools";
import { useCoState } from "jazz-tools/react-native";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { TeeStatus } from "spicylib/schema";
import { CourseTee } from "spicylib/schema";
import { stateCode } from "spicylib/utils";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Text } from "@/ui";

interface FavoriteTeeItemProps {
  item: MaybeLoaded<CourseTee>;
  /** Drag handler for reorderable lists. If provided, enables drag-to-reorder. */
  drag?: () => void;
  /** Whether the item is currently being dragged */
  isActive?: boolean;
  /** Explicit flag to show drag handle. Defaults to true if `drag` is provided. */
  isDraggable?: boolean;
  onPress: () => void;
  onRemove: () => void;
}

export function FavoriteTeeItem({
  item,
  drag,
  isActive,
  isDraggable: isDraggableProp,
  onPress,
  onRemove,
}: FavoriteTeeItemProps) {
  const courseTee = useCoState(
    CourseTee,
    item?.$isLoaded ? item.$jazz.id : undefined,
    {
      resolve: {
        course: {
          facility: true,
        },
        tee: {
          holes: { $each: true },
        },
      },
    },
  );

  if (
    !courseTee?.$isLoaded ||
    !courseTee.course?.$isLoaded ||
    !courseTee.tee?.$isLoaded
  ) {
    return null;
  }

  const course = courseTee.course;
  const tee = courseTee.tee;

  const par = tee.holes?.$isLoaded
    ? tee.holes.reduce((sum, h) => sum + (h?.$isLoaded ? h.par : 0), 0)
    : null;
  const rating = tee.ratings?.total?.rating ?? null;
  const slope = tee.ratings?.total?.slope ?? null;
  const facilityName =
    course.facility?.$isLoaded && course.facility.name !== course.name
      ? course.facility.name
      : null;
  const status: TeeStatus | undefined = tee.status;

  // Default isDraggable to true if drag handler is provided
  const isDraggable = isDraggableProp ?? !!drag;

  // Generate testID from course name for E2E testing
  const courseNameSlug = course.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const testId = `favorite-tee-${courseNameSlug}`;

  return (
    <TouchableOpacity
      testID={testId}
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
                <Text style={styles.teeName}>{tee.name}</Text>
                {status === "inactive" && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={styles.courseName}>{course.name}</Text>
              {facilityName && (
                <Text style={styles.facilityName}>{facilityName}</Text>
              )}
              <Text style={styles.courseLocation}>
                {course.city}, {stateCode(course.state)}
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
            {tee.gender} • {tee.totalYardage} yards • Par {par ?? "—"}
            {rating !== null && slope !== null && (
              <>
                {" "}
                • Rating: {rating.toFixed(1)} • Slope: {slope}
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
