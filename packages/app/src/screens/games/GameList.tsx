import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAccount, useCoState } from "jazz-tools/react-native";
import { ListOfGames, PlayerAccount } from "spicylib/schema";
import { GameList } from "@/components/game/list/GameList";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Button, Screen } from "@/ui";

export function GameListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesNavigatorParamList>>();

  // TODO: move to useGameList() hook?
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
        games: {
          $each: {
            // @ts-expect-error TODO: smth with first element in resolve object
            start: true,
            name: true,
            players: {
              $each: true,
            },
          },
        },
      },
    },
    select: (me) =>
      me.$isLoaded
        ? me
        : me.$jazz.loadingState === "loading"
          ? undefined
          : null,
  });
  const games = useCoState(
    ListOfGames,
    me?.$isLoaded && me.root?.$isLoaded ? me.root.games?.$jazz.id : undefined,
    {
      select: (games) =>
        games.$isLoaded
          ? games
          : games.$jazz.loadingState === "loading"
            ? undefined
            : null,
    },
  );
  if (!games) return null;

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
