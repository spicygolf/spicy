import React from 'react';
import { useAccount, useCoState } from 'jazz-tools/react-native';
import { GameList } from '@/components/game/list/GameList';
import { PlayerAccount } from '@/schema/accounts';
import { ListOfGames } from '@/schema/games';
import { Link, Screen, Text } from '@/ui';

export function GameListScreen() {
  const { me } = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
        games: {
          $each: {
            start: true,
            name: true,
            players: {
              $each: {
                name: true,
              },
            },
          },
        },
      },
    },
  });
  const games = useCoState(ListOfGames, me?.root?.games?.id);
  if (!games) return null;

  return (
    <Screen>
      <Link
        href={{
          name: 'NewGame',
          params: {},
        }}
      >
        <Text>New Game</Text>
      </Link>
      <GameList games={games} />
    </Screen>
  );
}
