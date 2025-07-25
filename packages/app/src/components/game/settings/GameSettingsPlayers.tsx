import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View } from "react-native";
import { GamePlayersList } from "@/components/game/settings/GamePlayersList";
import type { GameSettingsStackParamList } from "@/navigators/GameSettingsNavigator";
import { Button } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

export function GameSettingsPlayers() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View>
      <GamePlayersList />
      <Button
        label="Add Player"
        onPress={() => navigation.navigate("AddPlayerNavigator")}
      />
    </View>
  );
}
