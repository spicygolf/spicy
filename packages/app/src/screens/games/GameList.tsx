import React from 'react';
import { useAccount, useCoState } from 'jazz-react-native';
import { GameList } from '@/components/game/list/GameList';
import { ListOfGames } from '@/schema/games';
import { Link, Screen, Text } from '@/ui';

export function GameListScreen() {
  const { me } = useAccount();
  const games = useCoState(ListOfGames, me.root?.games?.id, [{}]);
  console.log('games', games);
  if (!games) return null;

  return (
    <Screen>
      <Link
        href={{
          name: 'NewGame',
          params: {},
        }}>
        <Text>New Game</Text>
      </Link>
      <GameList games={games} />
    </Screen>
  );
}
