/**
 * Developer Tools Screen
 *
 * Provides development and testing utilities. Only visible when __DEV__ is true
 * or the user has admin level access.
 */

import { useAccount } from "jazz-tools/react-native";
import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { Button, Screen, Text } from "@/ui";
import { clearPlayerRounds, deepDeleteAllGames } from "@/utils/e2eCleanup";

export function DeveloperToolsScreen() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastDeleteCount, setLastDeleteCount] = useState<number | null>(null);

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: {
          rounds: { $each: { scores: true } },
        },
        games: {
          $each: {
            holes: {
              $each: { teams: { $each: { rounds: true, options: true } } },
            },
            rounds: { $each: { round: { scores: true } } },
            players: true,
          },
        },
      },
    },
  });

  const gamesCount =
    me?.$isLoaded && me.root?.$isLoaded && me.root.games?.$isLoaded
      ? me.root.games.length
      : 0;

  const roundsCount =
    me?.$isLoaded &&
    me.root?.$isLoaded &&
    me.root.player?.$isLoaded &&
    me.root.player.rounds?.$isLoaded
      ? me.root.player.rounds.length
      : 0;

  const handleDeepDeleteAllGames = useCallback(async () => {
    if (!me?.$isLoaded || !me.root?.$isLoaded) {
      return;
    }

    if (gamesCount === 0 && roundsCount === 0) {
      Alert.alert(
        "Nothing to Delete",
        "There are no games or rounds to delete.",
      );
      return;
    }

    setIsDeleting(true);
    try {
      let deletedGames = 0;

      // Delete all games
      if (me.root.games?.$isLoaded && me.root.games.length > 0) {
        deletedGames = await deepDeleteAllGames(me.root.games);
      }

      // Clear the logged-in player's rounds
      if (me.root.player?.$isLoaded) {
        await clearPlayerRounds(me.root.player);
      }

      setLastDeleteCount(deletedGames);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to delete games",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [me, gamesCount, roundsCount]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.description}>
          Tools for development and testing. These may change or be removed in
          production builds.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>E2E Test Cleanup</Text>
          <Text style={styles.sectionDescription}>
            Deep delete all games and their related data (players, rounds,
            scores, teams), plus clear your personal rounds. This minimizes Jazz
            orphaned data by clearing nested structures before removing
            references.
          </Text>

          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Current games:</Text>
            <Text style={styles.statsValue}>{gamesCount}</Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Your rounds:</Text>
            <Text style={styles.statsValue}>{roundsCount}</Text>
          </View>

          {lastDeleteCount !== null && (
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Last deleted:</Text>
              <Text style={styles.statsValue}>{lastDeleteCount} games</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              testID="deep-delete-all-games-button"
              label={isDeleting ? "Deleting..." : "Deep Delete All Data"}
              onPress={handleDeepDeleteAllGames}
              disabled={isDeleting || (gamesCount === 0 && roundsCount === 0)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    gap: theme.gap(3),
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: theme.gap(2),
    gap: theme.gap(1.5),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.colors.secondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: theme.gap(1),
  },
}));
