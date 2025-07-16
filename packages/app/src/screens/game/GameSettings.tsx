import React from 'react';
import { View } from 'react-native';
import { GameSettingsPlayers } from '@/components/game/settings/GameSettingsPlayers';
import { useGame } from '@/hooks';
import type { GameSettingsProps } from '@/navigators/GameNavigator';
import { Screen, Text } from '@/ui';

export function GameSettings(props: GameSettingsProps) {
  const { game } = useGame(props.route.params.gameId);
  if (!game) {
    console.log('GameSettings: game is null');
    return null;
  }

  return (
    <Screen>
      <View>
        <Text>Game: {game.name}</Text>
      </View>
      <Text>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <GameSettingsPlayers game={game} />
    </Screen>
  );
}
