import { Account, CoMap, Profile, co } from 'jazz-tools';
import { ListOfGames } from '@/schema/games';
import { defaultSpec, GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';

export class PlayerAccountRoot extends CoMap {
  name = co.string;
  games = co.ref(ListOfGames);
  specs = co.ref(ListOfGameSpecs);
  // TODO: link Player to this account somewhere (I think here, maybe in PlayerAccount?)
}

export class PlayerAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PlayerAccountRoot);

  migrate(this: PlayerAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    console.log('this._refs.root', this._refs.root);
    if (!this._refs.root) {
      const name = creationProps?.name || '';
      const games = ListOfGames.create([], { owner: this });
      const specs = ListOfGameSpecs.create([], { owner: this });
      const spec = GameSpec.create(defaultSpec, { owner: this });
      specs.push(spec);

      this.root = PlayerAccountRoot.create(
        { name, games, specs },
        { owner: this },
      );
    }
  }
}
