import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { DraxProvider } from "react-native-drax";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  GameGroup,
  ListOfGameGroups,
  ListOfRoundToGames,
} from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";
import type { PlayerRoundItem } from "@/components/game/settings/teams/types";
import { useGame } from "@/hooks";
import { Text } from "@/ui";
import type { GroupSection } from "./GroupAssignments";
import { GroupAssignments } from "./GroupAssignments";

export function GameGroupsList() {
  const { game } = useGame(undefined, {
    resolve: {
      scope: {
        groups: {
          $each: {
            rounds: {
              $each: true,
            },
          },
        },
      },
      spec: { $each: { $each: true } },
      specRef: { $each: { $each: true } },
      players: {
        $each: {
          name: true,
        },
      },
      rounds: {
        $each: {
          handicapIndex: true,
          round: {
            playerId: true,
          },
        },
      },
    },
  });

  const { theme } = useUnistyles();

  // Check if multi_group is enabled in the spec
  const isMultiGroup = useMemo((): boolean => {
    if (!game?.$isLoaded) return false;

    if (game.$jazz.has("spec") && game.spec?.$isLoaded) {
      const value = getSpecField(game.spec, "multi_group");
      if (value !== undefined) return value === true || value === "true";
    }
    if (game.$jazz.has("specRef") && game.specRef?.$isLoaded) {
      const value = getSpecField(game.specRef, "multi_group");
      if (value !== undefined) return value === true || value === "true";
    }
    return false;
  }, [game?.$jazz.id]);

  // Build all player rounds from game.rounds
  const allPlayerRounds = useMemo((): PlayerRoundItem[] => {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded) return [];

    const items: PlayerRoundItem[] = [];
    for (const roundToGame of game.rounds as Iterable<
      (typeof game.rounds)[number]
    >) {
      if (!roundToGame?.$isLoaded || !roundToGame.round?.$isLoaded) continue;

      const playerId = roundToGame.round.playerId;

      let player = null;
      if (game.players?.$isLoaded) {
        for (const p of game.players as Iterable<
          (typeof game.players)[number]
        >) {
          if (p?.$isLoaded && p.$jazz.id === playerId) {
            player = p;
            break;
          }
        }
      }

      if (!player) continue;

      items.push({
        id: roundToGame.$jazz.id,
        roundToGame,
        playerName: player.name,
        handicap: roundToGame.handicapIndex,
      });
    }
    return items;
  }, [game]);

  // Build a lookup: roundToGameId -> groupIndex (or undefined if unassigned)
  const playerGroupMap = useMemo((): Map<string, number> => {
    const map = new Map<string, number>();
    if (
      !game?.$isLoaded ||
      !game.scope?.$isLoaded ||
      !game.scope.$jazz.has("groups") ||
      !game.scope.groups?.$isLoaded
    ) {
      return map;
    }

    for (let i = 0; i < game.scope.groups.length; i++) {
      const group = game.scope.groups[i];
      if (!group?.$isLoaded || !group.rounds?.$isLoaded) continue;

      for (const rtg of group.rounds as Iterable<
        (typeof group.rounds)[number]
      >) {
        if (!rtg?.$isLoaded) continue;
        map.set(rtg.$jazz.id, i);
      }
    }

    return map;
  }, [game]);

  // Derive group sections from Jazz data
  const groups = useMemo((): GroupSection[] => {
    if (
      !game?.$isLoaded ||
      !game.scope?.$isLoaded ||
      !game.scope.$jazz.has("groups") ||
      !game.scope.groups?.$isLoaded
    ) {
      return [];
    }

    const sections: GroupSection[] = [];
    for (let i = 0; i < game.scope.groups.length; i++) {
      const group = game.scope.groups[i];
      if (!group?.$isLoaded) continue;

      const players = allPlayerRounds.filter(
        (p) => playerGroupMap.get(p.id) === i,
      );

      sections.push({
        groupIndex: i,
        groupName: group.name || `Group ${i + 1}`,
        teeTime: group.teeTime || "",
        players,
      });
    }

    return sections;
  }, [game, allPlayerRounds, playerGroupMap]);

  // Derive unassigned players
  const unassigned = useMemo((): PlayerRoundItem[] => {
    return allPlayerRounds.filter((p) => !playerGroupMap.has(p.id));
  }, [allPlayerRounds, playerGroupMap]);

  const groupCount = groups.length;

  // --- CRUD Handlers ---

  const handleDrop = useCallback(
    (playerId: string, targetGroupIndex: number) => {
      if (!game?.$isLoaded || !game.scope?.$isLoaded) return;
      if (!game.scope.$jazz.has("groups") || !game.scope.groups?.$isLoaded) {
        return;
      }

      // Find the RoundToGame object for this player
      const playerRound = allPlayerRounds.find((p) => p.id === playerId);
      if (!playerRound) return;

      // Remove from current group (if assigned)
      const currentGroupIndex = playerGroupMap.get(playerId);
      if (currentGroupIndex !== undefined) {
        const currentGroup = game.scope.groups[currentGroupIndex];
        if (currentGroup?.$isLoaded && currentGroup.rounds?.$isLoaded) {
          const idx = findRoundIndex(currentGroup.rounds, playerId);
          if (idx !== -1) {
            currentGroup.rounds.$jazz.splice(idx, 1);
          }
        }
      }

      // Add to target group (unless moving to unassigned)
      if (targetGroupIndex >= 0) {
        const targetGroup = game.scope.groups[targetGroupIndex];
        if (targetGroup?.$isLoaded) {
          if (!targetGroup.$jazz.has("rounds")) {
            // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
            // @ts-ignore - Jazz $jazz.set types are overly strict
            targetGroup.$jazz.set(
              "rounds",
              ListOfRoundToGames.create([], { owner: game.$jazz.owner }),
            );
          }
          if (targetGroup.rounds?.$isLoaded) {
            targetGroup.rounds.$jazz.push(playerRound.roundToGame);
          }
        }
      }
    },
    [game, allPlayerRounds, playerGroupMap],
  );

  const handleAutoAssign = useCallback(() => {
    if (!game?.$isLoaded || !game.scope?.$isLoaded) return;

    // Shuffle all players
    const shuffled = [...allPlayerRounds].sort(() => Math.random() - 0.5);
    const numGroups = Math.max(1, Math.ceil(shuffled.length / 4));

    // Create fresh groups list
    const newGroups = ListOfGameGroups.create([], {
      owner: game.$jazz.owner,
    });

    for (let i = 0; i < numGroups; i++) {
      const roundsList = ListOfRoundToGames.create([], {
        owner: game.$jazz.owner,
      });

      const group = GameGroup.create(
        {
          name: `Group ${i + 1}`,
          rounds: roundsList,
        },
        { owner: game.$jazz.owner },
      );

      newGroups.$jazz.push(group);
    }

    // Round-robin assign players
    for (let i = 0; i < shuffled.length; i++) {
      const groupIdx = i % numGroups;
      const group = newGroups[groupIdx];
      if (group?.$isLoaded && group.rounds?.$isLoaded) {
        // biome-ignore lint/suspicious/noTsIgnore: Jazz CoList push MaybeLoaded type mismatch
        // @ts-ignore - RoundToGame is loaded but CoList push expects deeper loaded type
        group.rounds.$jazz.push(shuffled[i].roundToGame);
      }
    }

    // Set on scope
    // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
    // @ts-ignore - Jazz $jazz.set types are overly strict
    game.scope.$jazz.set("groups", newGroups);
  }, [game, allPlayerRounds]);

  const handleAddGroup = useCallback(() => {
    if (!game?.$isLoaded || !game.scope?.$isLoaded) return;

    if (!game.scope.$jazz.has("groups")) {
      const groupsList = ListOfGameGroups.create([], {
        owner: game.$jazz.owner,
      });
      const group = GameGroup.create(
        {
          name: "Group 1",
          rounds: ListOfRoundToGames.create([], { owner: game.$jazz.owner }),
        },
        { owner: game.$jazz.owner },
      );
      groupsList.$jazz.push(group);
      // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
      // @ts-ignore - Jazz $jazz.set types are overly strict
      game.scope.$jazz.set("groups", groupsList);
      return;
    }

    if (!game.scope.groups?.$isLoaded) return;

    const newIndex = game.scope.groups.length;
    const group = GameGroup.create(
      {
        name: `Group ${newIndex + 1}`,
        rounds: ListOfRoundToGames.create([], { owner: game.$jazz.owner }),
      },
      { owner: game.$jazz.owner },
    );
    game.scope.groups.$jazz.push(group);
  }, [game]);

  const handleDeleteGroup = useCallback(
    (groupIndex: number) => {
      if (
        !game?.$isLoaded ||
        !game.scope?.$isLoaded ||
        !game.scope.$jazz.has("groups") ||
        !game.scope.groups?.$isLoaded
      ) {
        return;
      }

      // Only delete if the group is empty and not the last group
      const group = game.scope.groups[groupIndex];
      if (!group?.$isLoaded) return;
      if (group.rounds?.$isLoaded && group.rounds.length > 0) return;
      if (game.scope.groups.length <= 1) return;

      game.scope.groups.$jazz.splice(groupIndex, 1);
    },
    [game],
  );

  const handleTeeTimeChange = useCallback(
    (groupIndex: number, teeTime: string) => {
      if (
        !game?.$isLoaded ||
        !game.scope?.$isLoaded ||
        !game.scope.$jazz.has("groups") ||
        !game.scope.groups?.$isLoaded
      ) {
        return;
      }

      const group = game.scope.groups[groupIndex];
      if (!group?.$isLoaded) return;

      // biome-ignore lint/suspicious/noTsIgnore: Jazz $jazz.set types require this
      // @ts-ignore - Jazz $jazz.set types are overly strict
      group.$jazz.set("teeTime", teeTime);
    },
    [game],
  );

  // Show non-multi-group message if spec doesn't enable it
  if (game?.$isLoaded && !isMultiGroup) {
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
        <Text style={styles.emptyTitle}>Groups Not Available</Text>
        <Text style={styles.emptyText}>
          This game type does not use player groups.
        </Text>
      </View>
    );
  }

  return (
    <DraxProvider>
      <View style={styles.container}>
        <GroupAssignments
          allPlayerRounds={allPlayerRounds}
          groups={groups}
          unassigned={unassigned}
          onDrop={handleDrop}
          onAutoAssign={handleAutoAssign}
          onAddGroup={handleAddGroup}
          onDeleteGroup={handleDeleteGroup}
          onTeeTimeChange={handleTeeTimeChange}
          groupCount={groupCount}
        />
      </View>
    </DraxProvider>
  );
}

/**
 * Find the index of a RoundToGame in a rounds CoList by its Jazz ID.
 */
function findRoundIndex(
  // biome-ignore lint/suspicious/noExplicitAny: Jazz CoList iteration requires dynamic typing
  rounds: any,
  roundToGameId: string,
): number {
  for (let i = 0; i < rounds.length; i++) {
    const rtg = rounds[i];
    if (rtg?.$isLoaded && rtg.$jazz.id === roundToGameId) {
      return i;
    }
  }
  return -1;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
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
}));
