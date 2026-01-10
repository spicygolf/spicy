/**
 * Link GHIN Component
 *
 * Allows users to link their account to their GHIN player record.
 * This grants access to their imported games and player data.
 */

import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Game, ListOfGames, PlayerAccount } from "spicylib/schema";
import { apiPost } from "@/lib/api-client";
import { Button, Text, TextInput } from "@/ui";

interface LinkPlayerResult {
  success: boolean;
  playerId: string;
  playerName: string;
  gameIds: string[];
  favorites: {
    players: number;
    courseTees: number;
    errors: string[];
  };
  message: string;
}

export function LinkGhin() {
  const { theme } = useUnistyles();
  const me = useAccount(PlayerAccount, { resolve: { root: { player: true } } });
  const [ghinId, setGhinId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Check if linked to a GHIN/catalog player (not just the default player created on signup)
  const linkedPlayer =
    me?.$isLoaded && me.root?.$isLoaded && me.root.player?.$isLoaded
      ? me.root.player
      : null;
  const isLinked = linkedPlayer?.ghinId != null;

  const handleLink = async () => {
    if (!ghinId.trim()) {
      Alert.alert("Error", "Please enter your GHIN ID");
      return;
    }

    if (!me?.$isLoaded || !me.root?.$isLoaded) {
      Alert.alert("Error", "Account not loaded. Please try again.");
      return;
    }

    setIsLinking(true);

    try {
      // Call the API to link the player
      const result = await apiPost<LinkPlayerResult>("/player/link", {
        ghinId: ghinId.trim(),
      });

      // Wait for Jazz to sync the group membership
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const root = me.root;

      // Initialize games list if it doesn't exist
      if (!root.$jazz.has("games")) {
        root.$jazz.set(
          "games",
          ListOfGames.create([], { owner: root.$jazz.owner }),
        );
      }

      // Load and add games to root.games
      const gameIds = result.gameIds || [];
      let gamesLinked = 0;

      const loadedRoot = await root.$jazz.ensureLoaded({
        resolve: { games: true },
      });

      if (loadedRoot.games?.$isLoaded) {
        // Get existing game IDs to avoid duplicates
        const existingGameIds = new Set<string>();
        const gamesList = loadedRoot.games;
        for (let i = 0; i < gamesList.length; i++) {
          const existingGame = gamesList[i];
          if (existingGame?.$jazz?.id) {
            existingGameIds.add(existingGame.$jazz.id);
          }
        }

        for (const gameId of gameIds) {
          if (existingGameIds.has(gameId)) {
            continue;
          }
          const game = await Game.load(gameId);
          if (game?.$isLoaded) {
            loadedRoot.games.$jazz.push(game);
            gamesLinked++;
          }
        }
      }

      Alert.alert(
        "Success",
        `Linked to ${result.playerName}!\n\n${gamesLinked} game(s) added to your account.`,
      );
      setGhinId("");
    } catch (error) {
      console.error("Link failed:", error);
      Alert.alert(
        "Link Failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      "Unlink Player",
      "Are you sure you want to unlink your GHIN player? Your games will remain in your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            if (me?.$isLoaded && me.root?.$isLoaded) {
              // Clear the player reference by deleting it
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              delete (me.root as any).player;
              Alert.alert("Unlinked", "Your player has been unlinked.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GHIN Player Link</Text>

      {isLinked && linkedPlayer ? (
        <View style={styles.linkedContainer}>
          <View style={styles.linkedInfo}>
            <Text style={styles.linkedLabel}>Linked to:</Text>
            <Text style={styles.linkedName}>{linkedPlayer.name}</Text>
            {linkedPlayer.ghinId && (
              <Text style={styles.linkedGhin}>GHIN: {linkedPlayer.ghinId}</Text>
            )}
            {linkedPlayer.handicap?.$isLoaded &&
              linkedPlayer.handicap.display && (
                <Text style={styles.linkedHandicap}>
                  Handicap: {linkedPlayer.handicap.display}
                </Text>
              )}
          </View>
          <TouchableOpacity style={styles.unlinkButton} onPress={handleUnlink}>
            <Text style={[styles.unlinkText, { color: theme.colors.error }]}>
              Unlink
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.linkContainer}>
          <Text style={styles.description}>
            Enter your GHIN ID to link your account.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={ghinId}
              onChangeText={setGhinId}
              placeholder="Enter your GHIN ID"
              keyboardType="number-pad"
              editable={!isLinking}
            />
          </View>

          <Button
            label={isLinking ? "Linking..." : "Link Player"}
            onPress={handleLink}
            disabled={isLinking || !ghinId.trim()}
          />

          {isLinking && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                Linking player and importing games...
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(1),
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  linkContainer: {
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  linkedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  linkedInfo: {
    flex: 1,
  },
  linkedLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  linkedName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  linkedGhin: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  linkedHandicap: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  unlinkButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unlinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
}));
