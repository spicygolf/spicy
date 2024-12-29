import React, { useContext } from 'react';
import GameSettingsPlayers from '@/components/game/settings/GameSettingsPlayers';
import { GameContext } from '@/providers/game';
import { Screen, Text } from '@/ui';

export function GameSettings() {
  const { game } = useContext(GameContext);
  if (!game) return null;

  return (
    <Screen>
      <Text>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <GameSettingsPlayers />
    </Screen>
  );
}
