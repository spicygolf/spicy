import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { DraxScrollView, DraxView } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { slugify } from "spicylib/utils";
import type { PlayerRoundItem } from "@/components/game/settings/teams/types";
import { Button, Text, TextInput } from "@/ui";

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
  groupCount: number;
}

export function GroupAssignments({
  allPlayerRounds,
  groups,
  unassigned,
  onDrop,
  onAutoAssign,
  onAddGroup,
  onDeleteGroup,
  onTeeTimeChange,
  groupCount,
}: GroupAssignmentsProps) {
  const { theme } = useUnistyles();

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
        <Text style={styles.title}>Group Assignments</Text>
        <View style={styles.headerButtons}>
          <Button label="Add Group" onPress={onAddGroup} variant="secondary" />
          <Button label="Auto-Assign" onPress={onAutoAssign} />
        </View>
      </View>

      <DraxScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.columnsContainer}>
          {/* Left pane: Groups */}
          <View style={styles.leftPane}>
            {groups.map((group) => (
              <GroupDropZone
                key={group.groupIndex}
                group={group}
                groupCount={groupCount}
                onDrop={onDrop}
                onDeleteGroup={onDeleteGroup}
                onTeeTimeChange={onTeeTimeChange}
                theme={theme}
              />
            ))}
          </View>

          {/* Right pane: Unassigned */}
          <View style={styles.rightPane}>
            <UnassignedDropZone
              unassigned={unassigned}
              groupCount={groupCount}
              onDrop={onDrop}
              theme={theme}
            />
          </View>
        </View>
      </DraxScrollView>
    </>
  );
}

interface GroupDropZoneProps {
  group: GroupSection;
  groupCount: number;
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  onDeleteGroup: (groupIndex: number) => void;
  onTeeTimeChange: (groupIndex: number, teeTime: string) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function GroupDropZone({
  group,
  groupCount,
  onDrop,
  onDeleteGroup,
  onTeeTimeChange,
  theme,
}: GroupDropZoneProps) {
  const sectionTestId = `group-${group.groupIndex}-dropzone`;

  // A group can be deleted if it's empty and not the last remaining group
  const canDelete = group.players.length === 0 && groupCount > 1;

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
        <Text style={styles.groupHeaderText}>{group.groupName}</Text>
        <View style={styles.groupHeaderMiddle}>
          <TextInput
            testID={`group-${group.groupIndex}-tee-time`}
            style={styles.teeTimeInput}
            value={group.teeTime}
            onChangeText={(text: string) =>
              onTeeTimeChange(group.groupIndex, text)
            }
            placeholder="Tee time"
            placeholderTextColor={theme.colors.secondary}
          />
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

      <View style={styles.dropZone}>
        {group.players.length > 0 ? (
          <View style={styles.playersList}>
            {group.players.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                currentGroupIndex={group.groupIndex}
                groupCount={groupCount}
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
  groupCount: number;
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function UnassignedDropZone({
  unassigned,
  groupCount,
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
                groupCount={groupCount}
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
  groupCount: number;
  onDrop: (playerId: string, targetGroupIndex: number) => void;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function DraggablePlayer({
  player,
  currentGroupIndex,
  groupCount,
  onDrop,
  theme,
}: DraggablePlayerProps) {
  const playerSlug = slugify(player.playerName);
  const playerTestId = `group-player-${playerSlug}`;

  // Tap-to-cycle: unassigned (-1) -> group 0, group 0 -> group 1, ..., last group -> unassigned (-1)
  const nextGroupIndex = useMemo((): number => {
    if (currentGroupIndex === -1) return 0;
    if (currentGroupIndex >= groupCount - 1) return -1;
    return currentGroupIndex + 1;
  }, [currentGroupIndex, groupCount]);

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
        <Text style={styles.playerName}>{player.playerName}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  columnsContainer: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  leftPane: {
    flex: 6,
    gap: theme.gap(2),
  },
  rightPane: {
    flex: 4,
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
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(1.5),
    gap: theme.gap(1),
  },
  groupHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  groupHeaderMiddle: {
    flex: 1,
  },
  teeTimeInput: {
    fontSize: 12,
    paddingVertical: theme.gap(0.5),
    paddingHorizontal: theme.gap(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
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
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(1.5),
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
    paddingLeft: theme.gap(1.5),
    paddingRight: theme.gap(0.5),
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
    paddingRight: theme.gap(1.5),
    paddingLeft: theme.gap(0.5),
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
  },
  handicap: {
    fontSize: 12,
    color: theme.colors.secondary,
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
