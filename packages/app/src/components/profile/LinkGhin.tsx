/**
 * Link GHIN Component
 *
 * Allows users to link their account to their GHIN player record.
 *
 * Flow:
 * 1. User enters GHIN ID and taps "Link"
 * 2. If historical data exists, show import options as a bonus
 * 3. If no historical data, link directly
 */

import { useAccount } from "jazz-tools/react-native";
import { useState } from "react";
import { Alert, Switch, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Game, ListOfGames, PlayerAccount } from "spicylib/schema";
import { apiPost } from "@/lib/api-client";
import { Button, Text, TextInput } from "@/ui";

interface PlayerLookupResult {
  found: boolean;
  playerId?: string;
  playerName?: string;
  ghinId?: string;
  legacyId?: string;
  gameCount: number;
  favoritePlayersCount: number;
  favoriteCoursesCount: number;
}

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

interface ImportProgress {
  phase: "linking" | "importing";
  current: number;
  total: number;
  playerName?: string;
}

export function LinkGhin() {
  const { theme } = useUnistyles();
  const me = useAccount(PlayerAccount, { resolve: { root: { player: true } } });
  const [ghinId, setGhinId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  // Lookup/preview state
  const [lookupResult, setLookupResult] = useState<PlayerLookupResult | null>(
    null,
  );
  const [importGames, setImportGames] = useState(true);
  const [importFavoritePlayers, setImportFavoritePlayers] = useState(true);
  const [importFavoriteCourses, setImportFavoriteCourses] = useState(true);

  // Check if linked to a GHIN/catalog player (not just the default player created on signup)
  const linkedPlayer =
    me?.$isLoaded && me.root?.$isLoaded && me.root.player?.$isLoaded
      ? me.root.player
      : null;
  const isLinked = linkedPlayer?.$jazz.has("ghinId") ?? false;

  const handleLinkWithLookup = async () => {
    if (!ghinId.trim()) {
      Alert.alert("Error", "Please enter your GHIN ID");
      return;
    }

    if (!me?.$isLoaded || !me.root?.$isLoaded) {
      Alert.alert("Error", "Account not loaded. Please try again.");
      return;
    }

    setIsLinking(true);
    setProgress({ phase: "linking", current: 0, total: 0 });
    setLookupResult(null);

    try {
      // First, check if there's historical data
      const lookupData = await apiPost<PlayerLookupResult>("/player/lookup", {
        ghinId: ghinId.trim(),
      });

      if (!lookupData.found) {
        Alert.alert(
          "Not Found",
          `No player found with GHIN ID ${ghinId}. Make sure the player data has been imported.`,
        );
        setIsLinking(false);
        setProgress(null);
        return;
      }

      // Check if there's any historical data to import
      const hasHistoricalData =
        lookupData.gameCount > 0 ||
        lookupData.favoritePlayersCount > 0 ||
        lookupData.favoriteCoursesCount > 0;

      if (hasHistoricalData) {
        // Show import options as a bonus
        setLookupResult(lookupData);
        setImportGames(lookupData.gameCount > 0);
        setImportFavoritePlayers(lookupData.favoritePlayersCount > 0);
        setImportFavoriteCourses(lookupData.favoriteCoursesCount > 0);
        setIsLinking(false);
        setProgress(null);
        return;
      }

      // No historical data - proceed directly to link
      await performLink();
    } catch (error) {
      console.error("Link failed:", error);
      Alert.alert(
        "Link Failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      setIsLinking(false);
      setProgress(null);
    }
  };

  // Core link function - called directly or after showing import options
  const performLink = async () => {
    if (!me?.$isLoaded || !me.root?.$isLoaded) {
      Alert.alert("Error", "Account not loaded. Please try again.");
      return;
    }

    setIsLinking(true);
    setProgress({ phase: "linking", current: 0, total: 0 });

    try {
      // Call the API to link the player
      const result = await apiPost<LinkPlayerResult>("/player/link", {
        ghinId: ghinId.trim(),
      });

      const gameIds = result.gameIds || [];
      const hasGames = gameIds.length > 0;

      if (hasGames) {
        setProgress({
          phase: "importing",
          current: 0,
          total: gameIds.length,
          playerName: result.playerName,
        });
      }

      const root = me.root;

      // Initialize games list if it doesn't exist (with retry for group sync)
      const maxRetries = 5;
      const retryDelay = 500; // ms

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (!root.$jazz.has("games")) {
            root.$jazz.set(
              "games",
              ListOfGames.create([], { owner: root.$jazz.owner }),
            );
          }
          break; // Success, exit retry loop
        } catch {
          if (attempt === maxRetries - 1) {
            throw new Error(
              "Failed to initialize games list. Please try again.",
            );
          }
          // Wait with exponential backoff before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * 2 ** attempt),
          );
        }
      }

      // Load and add games to root.games
      let gamesLinked = 0;

      if (hasGames) {
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

          for (let i = 0; i < gameIds.length; i++) {
            const gameId = gameIds[i];
            setProgress({
              phase: "importing",
              current: i + 1,
              total: gameIds.length,
              playerName: result.playerName,
            });

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
      }

      // Build success message with games and favorites info
      const parts: string[] = [];

      if (gamesLinked > 0) {
        parts.push(`${gamesLinked} game(s)`);
      }

      if (result.favorites?.players > 0) {
        parts.push(`${result.favorites.players} favorite player(s)`);
      }

      if (result.favorites?.courseTees > 0) {
        parts.push(`${result.favorites.courseTees} favorite course/tee(s)`);
      }

      const message =
        parts.length > 0
          ? `Linked to ${result.playerName}!\n\nImported from Spicy Golf v0.3:\n• ${parts.join("\n• ")}`
          : `Linked to ${result.playerName}!`;

      Alert.alert("Success", message);
      setGhinId("");
    } catch (error) {
      console.error("Link failed:", error);
      Alert.alert(
        "Link Failed",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    } finally {
      setIsLinking(false);
      setProgress(null);
    }
  };

  const handleUnlink = () => {
    // TODO: Implement proper unlink that doesn't modify the shared catalog player.
    // Currently root.player points directly to the catalog player, so deleting
    // ghinId would affect all users. Need to either:
    // 1. Make player field optional in schema
    // 2. Create a user-owned copy of the player on link
    // For now, just show a message that unlinking isn't supported yet.
    Alert.alert(
      "Cannot Unlink",
      "Unlinking is not yet supported. Contact support if you need to change your linked GHIN account.",
    );
  };

  const handleCancel = () => {
    setLookupResult(null);
    setGhinId("");
  };

  const renderProgress = () => {
    if (!progress) return null;

    if (progress.phase === "linking") {
      return (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Linking your account...</Text>
        </View>
      );
    }

    const percentage = Math.round((progress.current / progress.total) * 100);

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>
          Importing games from Spicy Golf v0.3
        </Text>
        <Text style={styles.progressText}>
          We found {progress.total} game(s) from your previous account.
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressCount}>
          {progress.current} of {progress.total} games
        </Text>
      </View>
    );
  };

  const renderPreview = () => {
    if (!lookupResult?.found) return null;

    const hasData =
      lookupResult.gameCount > 0 ||
      lookupResult.favoritePlayersCount > 0 ||
      lookupResult.favoriteCoursesCount > 0;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>
          Welcome back, {lookupResult.playerName}!
        </Text>

        {hasData ? (
          <>
            <Text style={styles.previewSubtitle}>
              We found your data from Spicy Golf v0.3:
            </Text>

            {lookupResult.gameCount > 0 && (
              <View style={styles.optionRow}>
                <Switch
                  value={importGames}
                  onValueChange={setImportGames}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.action,
                  }}
                />
                <Text style={styles.optionLabel}>
                  Import {lookupResult.gameCount} game
                  {lookupResult.gameCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}

            {lookupResult.favoritePlayersCount > 0 && (
              <View style={styles.optionRow}>
                <Switch
                  value={importFavoritePlayers}
                  onValueChange={setImportFavoritePlayers}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.action,
                  }}
                />
                <Text style={styles.optionLabel}>
                  Import {lookupResult.favoritePlayersCount} favorite player
                  {lookupResult.favoritePlayersCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}

            {lookupResult.favoriteCoursesCount > 0 && (
              <View style={styles.optionRow}>
                <Switch
                  value={importFavoriteCourses}
                  onValueChange={setImportFavoriteCourses}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.action,
                  }}
                />
                <Text style={styles.optionLabel}>
                  Import {lookupResult.favoriteCoursesCount} favorite course
                  {lookupResult.favoriteCoursesCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.previewSubtitle}>
            No historical data found, but we can still link your account.
          </Text>
        )}

        <View style={styles.buttonRow}>
          <Button label="Cancel" onPress={handleCancel} variant="secondary" />
          <Button label="Link & Import" onPress={performLink} />
        </View>
      </View>
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
            {linkedPlayer.$jazz.has("ghinId") && (
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
          {isLinking ? (
            renderProgress()
          ) : lookupResult ? (
            renderPreview()
          ) : (
            <>
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
                />
              </View>

              <Button
                label="Link"
                onPress={handleLinkWithLookup}
                disabled={!ghinId.trim()}
              />
            </>
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
  progressContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.action,
    borderRadius: 4,
  },
  progressCount: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: "center",
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
  previewContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
}));
