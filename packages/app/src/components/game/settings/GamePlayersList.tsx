import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button } from "@/ui";
import { EmptyPlayersList } from "./EmptyPlayersList";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersList() {
  const { game } = useGame(undefined, {
    resolve: {
      players: {
        $each: {
          name: true,
          handicap: true,
          rounds: true,
        },
      },
    },
  });
  const navigation = useNavigation<NavigationProp>();

  const players =
    game?.$isLoaded && game.players?.$isLoaded
      ? game.players.filter((p) => p?.$isLoaded)
      : [];

  return (
    <View>
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
  flatlist: {
    marginVertical: theme.gap(1),
  },
}));
