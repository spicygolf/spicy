import React from 'react';
import { FlatList } from 'react-native';
import type { Game } from '@/schema/games';
import { Text } from '@/ui';

export function GamePlayersList({ game }: { game: Game | null }) {
  const players = game?.players;
  console.log('players', players);

  return (
    <FlatList
      data={players}
      renderItem={({ item: player }) => <Text>{player?.name}</Text>}
      keyExtractor={item => item?.id || ''}
    />
  );
}
