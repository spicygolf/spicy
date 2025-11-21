import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useGameContext } from "@/contexts/GameContext";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Text } from "@/ui";
import { EmptyPlayersList } from "./EmptyPlayersList";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersList() {
  const { game } = useGameContext();
  const navigation = useNavigation<NavigationProp>();

  const players = game?.players?.$isLoaded
    ? game.players.filter((p) => p?.$isLoaded)
    : [];
  const playerCount = players.length || 0;

  return (
    <View>
      <Text style={styles.title}>Players ({playerCount})</Text>
      <Button
        label="Add Player"
        onPress={() => navigation.navigate("AddPlayerNavigator")}
      />
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
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
  },
  flatlist: {
    marginBottom: theme.gap(2),
  },
}));
