import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { StalePlayer } from "@/hooks/useStaleHandicapCheck";
import { Button, ModalHeader, Text } from "@/ui";

interface StaleHandicapModalProps {
  visible: boolean;
  stalePlayers: StalePlayer[];
  onRefresh: (ghinIds: string[]) => void;
  onDismiss: () => void;
}

function getTimeAgo(date: Date | undefined): string {
  if (!date) return "unknown";
  const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StaleHandicapModal({
  visible,
  stalePlayers,
  onRefresh,
  onDismiss,
}: StaleHandicapModalProps): React.JSX.Element {
  function handleRefresh(): void {
    const ghinIds = stalePlayers.map((p) => p.ghinId);
    onRefresh(ghinIds);
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.modalOverlay} onPress={onDismiss}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <ModalHeader title="Stale Handicaps" onClose={onDismiss} />

          <Text style={styles.description}>
            The following handicaps may be out of date. Would you like to
            refresh them from GHIN?
          </Text>

          <View style={styles.playerList}>
            {stalePlayers.map((player) => (
              <View key={player.playerId} style={styles.playerRow}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.playerName}</Text>
                  <Text style={styles.timeAgo}>
                    {getTimeAgo(player.revDate)}
                  </Text>
                </View>
                <Text style={styles.handicapValue}>
                  {player.currentDisplay ?? "N/A"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <Button label="Ignore" variant="secondary" onPress={onDismiss} />
            </View>
            <View style={styles.buttonWrapper}>
              <Button label="Refresh" onPress={handleRefresh} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 400,
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: theme.gap(2),
  },
  playerList: {
    marginBottom: theme.gap(2),
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playerInfo: {
    flexDirection: "column",
    gap: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  handicapValue: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  buttonWrapper: {
    flex: 1,
  },
}));
