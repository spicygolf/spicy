import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useGameContext } from "@/contexts/GameContext";
import { EmptyPlayersList } from "./EmptyPlayersList";

export function GamePlayersList() {
  const { game } = useGameContext();

  return (
    <FlatList
      data={game?.players}
      renderItem={({ item }) => <GamePlayersListItem player={item} />}
      keyExtractor={(item) => item?.$jazz.id || ""}
      ListEmptyComponent={<EmptyPlayersList />}
      contentContainerStyle={styles.flatlist}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  flatlist: {
    marginBottom: theme.gap(2),
  },
}));
