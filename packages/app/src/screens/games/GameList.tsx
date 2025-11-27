import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAccount } from "jazz-tools/react-native";
import { PlayerAccount } from "spicylib/schema";
import { GameList } from "@/components/game/list/GameList";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Button, Screen } from "@/ui";

export function GameListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
        games: true,
      },
    },
  });

  const games = me?.$isLoaded ? me.root?.games : undefined;

  return (
    <Screen>
      <Button
        label="New Game"
        onPress={() => {
          navigation.navigate("NewGame");
        }}
      />
      <GameList games={games} />
    </Screen>
  );
}
