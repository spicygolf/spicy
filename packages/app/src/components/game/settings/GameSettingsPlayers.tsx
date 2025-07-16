import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Group } from 'jazz-tools';
import { GamePlayersList } from '@/components/game/settings/GamePlayersList';
import type { Game } from '@/schema/games';
import { Player } from '@/schema/players';
import { Text } from '@/ui';

export function GameSettingsPlayers(game: Game | null) {
  console.log('game', game);

  const addPlayer = () => {
    if (!game?.players) {
      console.error('GameSettingsPlayers: no players in game');
      return;
    }
    const group = game.players._owner;
    // TODO: do we need this?
    const player = Player.create(
      {
        name: 'Brad Anderson',
        email: 'brad@spicy.golf',
        short: 'boorad',
        level: '',
      },
      { owner: group },
    );
    game?.players?.push(player);
  };

  return (
    <View>
      <TouchableOpacity onPress={addPlayer}>
        <Text>Add Player</Text>
      </TouchableOpacity>

      <GamePlayersList game={game} />
    </View>
  );
}
