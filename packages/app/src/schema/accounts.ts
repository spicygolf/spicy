import { Account, CoMap, co } from 'jazz-tools';
import { ListOfGames } from '@/schema/games';
import { defaultSpec, GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';
import { Player } from '@/schema/players';

export class PlayerAccountRoot extends CoMap {
  player = co.ref(Player);
  games = co.ref(ListOfGames);
  specs = co.ref(ListOfGameSpecs);
}

export class PlayerAccount extends Account {
  // profile = co.ref(Profile); // using default profile for now
  root = co.ref(PlayerAccountRoot);

  async migrate(creationProps?: { name: string }) {
    if (this.root === undefined) {
      const name = creationProps?.name || '';
      this.root = PlayerAccountRoot.create({
        player: Player.create({ name, short: name, email: '', level: '' }),
        games: ListOfGames.create([], { owner: this }),
        specs: ListOfGameSpecs.create([GameSpec.create(defaultSpec)]),
      });
    }
  }
}
