import React from 'react';
import { useContext } from 'react';
import { FlatList, Text } from 'react-native';
import { GameContext } from '@/providers/game';

export function GamePlayersList() {
  const { game } = useContext(GameContext);
  const players = game?.players;
  console.log({ players });

  return (
    <FlatList
      data={players}
      renderItem={({ item: player }) => <Text>{player?.name}</Text>}
      keyExtractor={item => item?.id || ''}
    />
  );
}
