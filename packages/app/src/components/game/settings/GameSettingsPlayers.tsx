import React from 'react';
import { View } from 'react-native';
import { GamePlayersList } from '@/components/game/settings/GamePlayersList';
import type { Game } from '@/schema/games';
import { Player } from '@/schema/players';
import { Button } from '@/ui';

export function GameSettingsPlayers({ game }: { game: Game | null }) {
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
      <Button label="Add Player" onPress={addPlayer} />
      <GamePlayersList game={game} />
    </View>
  );
}
