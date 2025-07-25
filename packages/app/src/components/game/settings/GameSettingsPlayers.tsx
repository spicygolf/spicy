import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GamePlayersList } from "@/components/game/settings/GamePlayersList";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Button, Text } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GameSettingsPlayers() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View>
      <Text style={styles.title}>Players</Text>
      <GamePlayersList />
      <Button
        label="Add Player"
        onPress={() => navigation.navigate("AddPlayerNavigator")}
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
}));
