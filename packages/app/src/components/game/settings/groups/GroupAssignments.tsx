import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { DraxScrollView, DraxView } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatTime, parseTimeString, slugify } from "spicylib/utils";
import type { PlayerRoundItem } from "@/components/game/settings/teams/types";
import { Button, Text } from "@/ui";

/** Default maximum players per group (standard golf foursome) */
const MAX_GROUP_SIZE = 4;

export interface GroupSection {
  groupIndex: number;
  groupName: string;
  teeTime: string;
  players: PlayerRoundItem[];
}

interface GroupAssignmentsProps {
  allPlayerRounds: PlayerRoundItem[];
  groups: GroupSection[];
  unassigned: PlayerRoundItem[];
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  onAutoAssign: () => void;
  onAddGroup: () => void;
  onDeleteGroup: (groupIndex: number) => void;
  onTeeTimeChange: (groupIndex: number, teeTime: string) => void;
}

/** Renders group assignments with drag-drop player assignment and tee time pickers. */
export function GroupAssignments({
  allPlayerRounds,
  groups,
  unassigned,
  onDrop,
  onAutoAssign,
  onAddGroup,
  onDeleteGroup,
  onTeeTimeChange,
}: GroupAssignmentsProps) {
  const { theme } = useUnistyles();
  const groupSizes = groups.map((g) => g.players.length);

  if (allPlayerRounds.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIcon}>
          <FontAwesome6
            name="people-group"
            iconStyle="solid"
            size={48}
            color={theme.colors.secondary}
          />
        </View>
        <Text style={styles.emptyTitle}>No Players Yet</Text>
        <Text style={styles.emptyText}>
          Add players in the Players tab to assign them to groups.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <View style={styles.headerButtons}>
          <Button label="Add Group" onPress={onAddGroup} variant="secondary" />
          <Button label="Auto-Assign" onPress={onAutoAssign} />
        </View>
      </View>

      <View style={styles.columnsContainer}>
        {/* Left pane: Groups (independently scrollable) */}
        <DraxScrollView
          style={styles.leftPane}
          contentContainerStyle={styles.paneContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <GroupDropZone
              key={group.groupIndex}
              group={group}
              groupSizes={groupSizes}
              onDrop={onDrop}
              onDeleteGroup={onDeleteGroup}
              onTeeTimeChange={onTeeTimeChange}
              theme={theme}
            />
          ))}
        </DraxScrollView>

        {/* Right pane: Unassigned (independently scrollable) */}
        <DraxScrollView
          style={styles.rightPane}
          contentContainerStyle={styles.paneContent}
          showsVerticalScrollIndicator={false}
        >
          <UnassignedDropZone
            unassigned={unassigned}
            groupSizes={groupSizes}
            onDrop={onDrop}
            theme={theme}
          />
        </DraxScrollView>
      </View>
    </>
  );
}

interface GroupDropZoneProps {
  group: GroupSection;
  groupSizes: number[];
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  onDeleteGroup: (groupIndex: number) => void;
  onTeeTimeChange: (groupIndex: number, teeTime: string) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function GroupDropZone({
  group,
  groupSizes,
  onDrop,
  onDeleteGroup,
  onTeeTimeChange,
  theme,
}: GroupDropZoneProps) {
  const [showPicker, setShowPicker] = useState(false);
  const sectionTestId = `group-${group.groupIndex}-dropzone`;

  // A group can be deleted if it's empty
  const canDelete = group.players.length === 0;

  const pickerDate =
    parseTimeString(group.teeTime) ??
    (() => {
      const d = new Date();
      d.setHours(8, 0, 0, 0);
      return d;
    })();

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (date) {
      onTeeTimeChange(group.groupIndex, formatTime(date));
    }
  };

  const handleTeeTimeTap = () => {
    setShowPicker(true);
  };

  return (
    <DraxView
      style={styles.groupSection}
      testID={sectionTestId}
      onReceiveDragDrop={(event) => {
        if (event.dragged.payload) {
          onDrop(event.dragged.payload as string, group.groupIndex);
        }
      }}
      receivingStyle={styles.groupSectionReceiving}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupHeaderText}>{group.groupIndex + 1}</Text>
        <View style={styles.groupHeaderMiddle}>
          <Pressable
            testID={`group-${group.groupIndex}-tee-time`}
            style={styles.teeTimeButton}
            onPress={handleTeeTimeTap}
          >
            <Text
              style={
                group.teeTime ? styles.teeTimeText : styles.teeTimePlaceholder
              }
            >
              {group.teeTime || "Tee time"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.groupHeaderRight}>
          {canDelete && (
            <Pressable
              testID={`group-${group.groupIndex}-delete`}
              onPress={() => onDeleteGroup(group.groupIndex)}
              style={styles.deleteButton}
              hitSlop={8}
            >
              <FontAwesome6
                name="trash"
                iconStyle="solid"
                size={14}
                color={theme.colors.error}
              />
            </Pressable>
          )}
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{group.players.length}</Text>
          </View>
        </View>
      </View>

      {showPicker &&
        (Platform.OS === "ios" ? (
          <View style={styles.iosPickerContainer}>
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
            <Pressable
              style={styles.iosPickerDone}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.iosPickerDoneText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            onChange={handleTimeChange}
          />
        ))}

      <View style={styles.dropZone}>
        {group.players.length > 0 ? (
          <View style={styles.playersList}>
            {group.players.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                currentGroupIndex={group.groupIndex}
                groupSizes={groupSizes}
                onDrop={onDrop}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyGroup}>
            <FontAwesome6
              name="people-group"
              iconStyle="solid"
              size={20}
              color={theme.colors.secondary}
            />
            <Text style={styles.emptyGroupText}>Drag players here</Text>
          </View>
        )}
      </View>
    </DraxView>
  );
}

interface UnassignedDropZoneProps {
  unassigned: PlayerRoundItem[];
  groupSizes: number[];
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function UnassignedDropZone({
  unassigned,
  groupSizes,
  onDrop,
  theme,
}: UnassignedDropZoneProps) {
  return (
    <DraxView
      style={styles.unassignedSection}
      testID="group-unassigned-dropzone"
      onReceiveDragDrop={(event) => {
        if (event.dragged.payload) {
          onDrop(event.dragged.payload as string, -1);
        }
      }}
      receivingStyle={styles.groupSectionReceiving}
    >
      <View style={styles.unassignedHeader}>
        <Text style={styles.groupHeaderText}>Unassigned</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{unassigned.length}</Text>
        </View>
      </View>

      <View style={styles.dropZone}>
        {unassigned.length > 0 ? (
          <View style={styles.playersList}>
            {unassigned.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                currentGroupIndex={-1}
                groupSizes={groupSizes}
                onDrop={onDrop}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyGroup}>
            <Text style={styles.emptyGroupText}>All players assigned</Text>
          </View>
        )}
      </View>
    </DraxView>
  );
}

interface DraggablePlayerProps {
  player: PlayerRoundItem;
  currentGroupIndex: number;
  groupSizes: number[];
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function DraggablePlayer({
  player,
  currentGroupIndex,
  groupSizes,
  onDrop,
  theme,
}: DraggablePlayerProps) {
  const playerSlug = slugify(player.playerName);
  const playerTestId = `group-player-${playerSlug}`;

  // Tap: assign to first group with room (skipping current group).
  // If all groups full, move to unassigned. If already unassigned and all full, no-op.
  const nextGroupIndex = ((): number => {
    for (let i = 0; i < groupSizes.length; i++) {
      if (i === currentGroupIndex) continue;
      if (groupSizes[i] < MAX_GROUP_SIZE) return i;
    }
    return -1;
  })();

  return (
    <View style={styles.playerItem}>
      <DraxView
        testID={`${playerTestId}-drag`}
        style={styles.dragHandleContainer}
        draggingStyle={styles.dragHandleDragging}
        dragReleasedStyle={styles.dragHandleReleased}
        hoverStyle={styles.hoverView}
        dragPayload={player.id}
        renderContent={({ viewState }) => (
          <View
            style={[
              styles.dragHandle,
              viewState?.dragStatus === 2 && styles.dragHandleActive,
            ]}
          >
            <FontAwesome6
              name="grip-lines"
              iconStyle="solid"
              size={14}
              color={theme.colors.secondary}
            />
          </View>
        )}
        renderHoverContent={() => (
          <View style={styles.hoverContent}>
            <View style={styles.dragHandle}>
              <FontAwesome6
                name="grip-lines"
                iconStyle="solid"
                size={14}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={styles.hoverPlayerName}>{player.playerName}</Text>
            {player.handicap !== undefined && (
              <Text style={styles.hoverHandicap}>HI: {player.handicap}</Text>
            )}
          </View>
        )}
      />
      <Pressable
        testID={playerTestId}
        accessibilityLabel={playerTestId}
        style={styles.playerInfo}
        onPress={() => onDrop(player.id, nextGroupIndex)}
      >
        <Text style={styles.playerName} numberOfLines={1}>
          {player.playerName}
        </Text>
        {player.handicap !== undefined && (
          <Text style={styles.handicap}>{player.handicap}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  emptyIcon: {
    marginBottom: theme.gap(2),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingTop: theme.gap(2),
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  columnsContainer: {
    flex: 1,
    flexDirection: "row",
    gap: theme.gap(1),
  },
  leftPane: {
    flex: 1,
  },
  paneContent: {
    gap: theme.gap(2),
    paddingBottom: theme.gap(4),
  },
  rightPane: {
    flex: 1,
  },
  groupSection: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  groupSectionReceiving: {
    borderWidth: 2,
    borderColor: theme.colors.action,
    backgroundColor: `${theme.colors.action}10`,
  },
  unassignedSection: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(0.75),
    gap: theme.gap(0.5),
  },
  groupHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  groupHeaderMiddle: {
    flex: 1,
  },
  teeTimeButton: {
    paddingVertical: theme.gap(0.5),
    paddingHorizontal: theme.gap(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
  },
  teeTimeText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  teeTimePlaceholder: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  iosPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: "center",
  },
  iosPickerDone: {
    paddingVertical: theme.gap(0.5),
    paddingHorizontal: theme.gap(2),
  },
  iosPickerDoneText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.action,
  },
  groupHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
  },
  deleteButton: {
    padding: theme.gap(0.5),
  },
  countBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.gap(0.5),
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: theme.colors.secondary,
  },
  unassignedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingHorizontal: theme.gap(0.75),
  },
  dropZone: {
    minHeight: 60,
  },
  playersList: {
    backgroundColor: theme.colors.background,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  dragHandleContainer: {
    paddingVertical: theme.gap(0.75),
    paddingLeft: theme.gap(0.5),
    paddingRight: 2,
  },
  dragHandleDragging: {
    opacity: 0.3,
  },
  dragHandleReleased: {
    opacity: 1,
  },
  dragHandle: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandleActive: {
    backgroundColor: theme.colors.background,
    borderRadius: 4,
  },
  playerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(0.75),
    paddingRight: theme.gap(0.5),
    paddingLeft: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    flexShrink: 1,
  },
  handicap: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: "right",
    minWidth: 30,
    marginLeft: 2,
  },
  emptyGroup: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingVertical: theme.gap(3),
    paddingHorizontal: theme.gap(2),
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    minHeight: 60,
    justifyContent: "center",
    gap: theme.gap(1),
  },
  emptyGroupText: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  hoverView: {
    width: 240,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hoverContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(1),
    gap: theme.gap(1),
  },
  hoverPlayerName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  hoverHandicap: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
}));
