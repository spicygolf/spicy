import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GamePlayersListItem } from "@/components/game/settings/GamePlayersListItem";
import { useGameContext } from "@/contexts/GameContext";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Button, Text } from "@/ui";
import { EmptyPlayersList } from "./EmptyPlayersList";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GamePlayersList() {
  const { game } = useGameContext();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View>
      <Text style={styles.title}>Players ({game?.players?.length || 0})</Text>
      <Button
        label="Add Player"
        onPress={() => navigation.navigate("AddPlayerNavigator")}
      />
      <FlatList
        data={game?.players}
        renderItem={({ item }) => <GamePlayersListItem player={item} />}
        keyExtractor={(item) => item?.$jazz.id || ""}
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
