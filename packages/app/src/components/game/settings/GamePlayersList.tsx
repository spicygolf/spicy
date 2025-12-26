import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAccount } from "jazz-tools/react-native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PlayerAccount } from "spicylib/schema";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useAddPlayerToGame, useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button } from "@/ui";
import { playerToPlayerData } from "@/utils/playerToPlayerData";
import { EmptyPlayersList } from "./EmptyPlayersList";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersList() {
  const { game } = useGame(undefined, {
    resolve: {
      players: {
        $each: {
          name: true,
          handicap: true,
          ghinId: true,
        },
      },
    },
    select: (g) => {
      if (!g.$isLoaded) return null;
      if (!g.players?.$isLoaded) return null;
      return g;
    },
  });
  const navigation = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: {
          handicap: true,
        },
      },
    },
  });

  const players =
    game?.$isLoaded && game.players?.$isLoaded
      ? game.players.filter((p) => p?.$isLoaded)
      : [];

  // Check if current player is already in the game
  const isMeInGame = useMemo(() => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.player?.$isLoaded) {
      return true; // Hide button if we can't determine
    }
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return true;
    }

    const myPlayerId = me.root.player.$jazz.id;
    const myGhinId = me.root.player.ghinId;

    return game.players.some((p) => {
      if (!p?.$isLoaded) return false;
      // Match by Jazz ID or GHIN ID
      return p.$jazz.id === myPlayerId || (myGhinId && p.ghinId === myGhinId);
    });
  }, [me, game]);

  const [isAddingMe, setIsAddingMe] = useState(false);

  const handleAddMe = useCallback(async () => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.player?.$isLoaded) {
      return;
    }

    setIsAddingMe(true);
    try {
      const playerData = playerToPlayerData(me.root.player);
      const result = await addPlayerToGame(playerData);

      if (result.isOk()) {
        navigation.navigate("AddRoundToGame", {
          playerId: result.value.$jazz.id,
        });
      } else {
        console.error("Failed to add me to game:", result.error);
      }
    } finally {
      setIsAddingMe(false);
    }
  }, [me, addPlayerToGame, navigation]);

  return (
    <View>
      <View style={styles.buttonRow}>
        <View style={styles.addPlayerButton}>
          <Button
            label="Add Player"
            onPress={() => navigation.navigate("AddPlayerNavigator")}
          />
        </View>
        {!isMeInGame && (
          <Button label="Add Me" onPress={handleAddMe} disabled={isAddingMe} />
        )}
      </View>
      <FlatList
        data={players}
        renderItem={({ item }) => <GamePlayersListItem player={item} />}
        keyExtractor={(item) => item.$jazz.id}
        ListEmptyComponent={<EmptyPlayersList />}
        contentContainerStyle={styles.flatlist}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  buttonRow: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  addPlayerButton: {
    flex: 1,
  },
  flatlist: {
    marginVertical: theme.gap(1),
  },
}));
