import React from 'react';
import { useContext } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Group } from 'jazz-tools';
import { GamePlayersList } from '@/components/game/settings/GamePlayersList';
import { GameContext } from '@/providers/game';
import { Player } from '@/schema/players';
import { Text } from '@/ui';

export function GameSettingsPlayers() {
  const { game } = useContext(GameContext);
  console.log('game', game);
  const players = []; //game?.players;

  const addPlayer = () => {
    const group = Group.create();
    group.addMember('everyone', 'writer');
    const player = Player.create(
      { name: 'Brad Anderson', email: 'brad@spicy.golf', short: 'boorad' },
      { owner: group },
    );
    players.push(player);
  };

  return (
    <View>
      <TouchableOpacity onPress={addPlayer}>
        <Text>Add Player</Text>
      </TouchableOpacity>

      <GamePlayersList />
    </View>
  );
}
