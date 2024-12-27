import React from 'react';
import { GameList } from '@/components/game/list/GameList';
import { useAccount, useCoState } from '@/providers/jazz';
import { ListOfGames } from '@/schema/games';
import { Link, Screen, Text } from '@/ui';

export default function GameListScreen() {
  const { me } = useAccount();
  const games = useCoState(ListOfGames, me.root?.games?.id, [{}]);
  console.log('games', games);

  return (
    <Screen>
      <Link
        href={{
          name: 'NewGame',
          params: {},
        }}>
        <Text>New Game</Text>
      </Link>
      <GameList games={games!} />
    </Screen>
  );
}
