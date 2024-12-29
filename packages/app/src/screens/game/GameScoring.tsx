import React, { useContext } from 'react';
import { GameContext } from '@/providers/game';
import { Screen, Text } from '@/ui';

export function GameScoring() {
  const { game } = useContext(GameContext);
  if (!game) return null;

  return (
    <Screen>
      <Text>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <Text>scoring</Text>
    </Screen>
  );
}
