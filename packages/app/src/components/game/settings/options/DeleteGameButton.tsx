import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { useDeleteGame, useGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";

export function DeleteGameButton() {
  const { theme } = useUnistyles();
  const [showModal, setShowModal] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  const { game } = useGame(undefined, {
    resolve: {
      rounds: {
        $each: {
          round: {
            scores: true,
          },
        },
      },
    },
  });

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        games: true,
      },
    },
  });

  const games = me?.$isLoaded ? me.root?.games : undefined;

  const { canDelete, hasRoundsWithScores, roundsWithScoresCount, deleteGame } =
    useDeleteGame(game, games);

  const handleDelete = () => {
    const success = deleteGame();
    if (success) {
      setShowModal(false);
      // Navigate back to games list and reset the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: "GamesList" }],
      });
    }
  };

  return (
    <>
      <Pressable
        style={styles.deleteButton}
        onPress={() => setShowModal(true)}
        disabled={!canDelete}
      >
        <FontAwesome6
          name="trash-can"
          iconStyle="solid"
          size={16}
          color={theme.colors.error}
        />
        <Text style={styles.deleteButtonText}>Delete Game</Text>
        <FontAwesome6
          name="chevron-right"
          iconStyle="solid"
          size={14}
          color={theme.colors.error}
        />
      </Pressable>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Game</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <FontAwesome6
                  name="xmark"
                  iconStyle="solid"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to delete this game? This cannot be undone.
            </Text>

            {hasRoundsWithScores && (
              <View style={styles.infoBox}>
                <FontAwesome6
                  name="circle-info"
                  iconStyle="solid"
                  size={16}
                  color={theme.colors.action}
                />
                <Text style={styles.infoText}>
                  {roundsWithScoresCount} round
                  {roundsWithScoresCount !== 1 ? "s" : ""} with scores will be
                  preserved in player history.
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleDelete}>
                <Text style={styles.confirmButtonText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    gap: theme.gap(1.5),
  },
  deleteButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.error,
  },
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(2),
    paddingBottom: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.error,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.gap(2),
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.gap(1),
    backgroundColor: `${theme.colors.action}15`,
    padding: theme.gap(1.5),
    borderRadius: 8,
    marginBottom: theme.gap(2),
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1.5),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(2),
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
}));
