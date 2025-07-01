import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import type { Game } from '@/schema/games';
import { Link, Text } from '@/ui';

export function GameListItem({
  game,
  deleteGame,
}: {
  game: Game | null;
  deleteGame: (id: string) => void;
}) {
  if (!game) return null;
  return (
    <View>
      <Link
        href={{
          path: `/games/${game.id}/settings`,
        }}
      >
        <View>
          <Text>{game.name}</Text>
          <Text>
            {game.start.toLocaleDateString()} -{' '}
            {game.start.toLocaleTimeString()}
          </Text>
        </View>
      </Link>
      <View>
        <TouchableOpacity onPress={() => deleteGame(game.id)}>
          <Text>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
