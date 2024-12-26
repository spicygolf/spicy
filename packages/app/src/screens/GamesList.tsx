import {useAccount, useCoState} from 'providers/jazz';
import {GameList} from 'components/game/list/GameList';
import {ListOfGames} from 'schema/games';
import {SafeAreaView, Text, View} from 'react-native';

export default function GameListScreen() {
  const {me} = useAccount();
  const games = useCoState(ListOfGames, me.root?.games?.id, [{}]);

  return (
    <SafeAreaView>
      <View>
        {/* <Link
          href={{
            pathname: '/games/new',
            params: {},
          }}
          className="bg-blue-500 p-4 rounded-md my-4 flex-row items-center justify-center"> */}
          <Text>New Game</Text>
        {/* </Link> */}
        <GameList games={games!} />
      </View>
    </SafeAreaView>
  );
}
