import { useAccount } from 'jazz-tools/react-core';
import { PlayerAccount } from '@/schema/accounts';
import { ListOfGameHoles } from '@/schema/gameholes';
import { Game } from '@/schema/games';
import type { GameSpec } from '@/schema/gamespecs';
import { ListOfGameSpecs } from '@/schema/gamespecs';
import { ListOfPlayers, Player } from '@/schema/players';
import { ListOfRoundToGames } from '@/schema/rounds';

export function useCreateGame() {
  const { me } = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
        games: true,
      },
    },
  });

  return (spec: GameSpec): Game | undefined => {
    if (!me || !me.root) {
      console.error('useCreateGame: user account not loaded');
      return;
    }
    const owner = me;

    const specs = ListOfGameSpecs.create([], { owner });
    specs.push(spec);
    const holes = ListOfGameHoles.create([], { owner });
    const players = ListOfPlayers.create([], { owner });
    const player = me.root?.player;

    if (!player) {
      console.warn('useCreateGame: no player in PlayerAccount');
    } else {
      players.push(
        Player.create(
          {
            ...player,
            handicap: player.handicap ?? undefined,
            envs: player.envs ?? undefined,
          },
          { owner },
        ),
      );
    }

    const rounds = ListOfRoundToGames.create([], { owner });

    const game = Game.create(
      {
        start: new Date(),
        name: spec.name,
        specs,
        holes,
        players,
        rounds,
      },
      { owner },
    );

    me.root.games?.push(game);
    return game;
  };
}
