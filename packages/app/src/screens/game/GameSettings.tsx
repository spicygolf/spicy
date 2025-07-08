import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GameSettingsPlayers } from '@/components/game/settings/GameSettingsPlayers';
import type { GameSettingsProps } from '@/navigators/GameNavigator';
import { GameContext } from '@/providers/game';
import { Screen, Text } from '@/ui';

export function GameSettings(props: GameSettingsProps) {
  console.log('GameSettings props', props);

  const { game } = useContext(GameContext);
  console.log('GameSettings game', game);
  if (!game)
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );

  return (
    <Screen>
      <View>
        <Text>Game: {game.name}</Text>
      </View>
      <Text>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <GameSettingsPlayers />
    </Screen>
  );
}
