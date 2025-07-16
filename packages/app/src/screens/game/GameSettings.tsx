import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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
        <Text style={styles.name}>{game.name}</Text>
      </View>
      <Text style={styles.date}>
        {game.start.toLocaleDateString()} - {game.start.toLocaleTimeString()}
      </Text>
      <GameSettingsPlayers game={game} />
    </Screen>
  );
}

const styles = StyleSheet.create(theme => ({
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  date: {
    fontSize: 14,
    color: theme.colors.secondary,
    alignSelf: 'center',
    marginBottom: theme.gap(2),
  },
}));
