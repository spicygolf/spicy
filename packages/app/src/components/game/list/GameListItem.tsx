import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { co } from 'jazz-tools';
import { Game } from '@/schema/games';
import { Text } from '@/ui';

export function GameListItem({
  game,
  deleteGame,
}: {
  game: co<Game | null>;
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
        <Text>{game.name}</Text>
        <Text>
          {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
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
