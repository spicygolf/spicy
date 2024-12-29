import { Account, CoMap, Profile, co } from 'jazz-tools';
import { ListOfGames } from '@/schema/games';
import { defaultSpec, GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';
import { Player } from '@/schema/players';

export class PlayerAccountRoot extends CoMap {
  name = co.string;
  player = co.ref(Player);
  games = co.ref(ListOfGames);
  specs = co.ref(ListOfGameSpecs);
}

export class PlayerAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PlayerAccountRoot);

  migrate(this: PlayerAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    // console.log('this._refs.root', this._refs.root);
    if (!this._refs.root) {
      const name = creationProps?.name || '';
      const player = Player.create(
        { name, short: name, email: '', level: '' },
        { owner: this },
      );
      const games = ListOfGames.create([], { owner: this });
      const specs = ListOfGameSpecs.create([], { owner: this });
      const spec = GameSpec.create(defaultSpec, { owner: this });
      specs.push(spec);

      this.root = PlayerAccountRoot.create(
        { name, player, games, specs },
        { owner: this },
      );
    }
  }
}
