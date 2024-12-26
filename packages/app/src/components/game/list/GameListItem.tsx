import {Text, TouchableOpacity, View} from 'react-native';
import {Game} from 'schema/games';

export function GameListItem({
  game,
  deleteGame,
}: {
  game: Game;
  deleteGame: (id: string) => void;
}) {
  if (!game) return null;
  return (
    <View>
      {/* <Link
        href={{
          pathname: '/games/[game]/settings',
          params: {game: game.id},
        }}> */}
        <View>
          <Text
            role="heading"
          >
            {game.name}
          </Text>
          <Text>
            {game.start.toLocaleDateString()} -{' '}
            {game.start.toLocaleTimeString()}
          </Text>
        </View>
      {/* </Link> */}
      <View>
        <TouchableOpacity onPress={() => deleteGame(game.id)}>
          <Text>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
